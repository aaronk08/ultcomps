from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import requests
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import os
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Load environment variables
from dotenv import load_dotenv
import os

load_dotenv()

from email_service import email_service
s = URLSafeTimedSerializer(app.config['SECRET_KEY'])

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)
login_manager = LoginManager(app)

# Add rate limiting for password reset requests
reset_requests = {}

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False, index=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = password

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    print(f"Attempting to register user: {username} with email: {email}")
    
    # Check if email already exists
    if User.query.filter_by(email=email).first():
        print(f"Registration failed: Email {email} already exists")
        return jsonify({
            'success': False,
            'message': 'Email already registered.'
        }), 400  # Bad Request
    
    # Check if username already exists
    if User.query.filter_by(username=username).first():
        print(f"Registration failed: Username {username} already exists")
        return jsonify({
            'success': False,
            'message': 'Username already taken.'
        }), 400  # Bad Request
    
    try:
        # Start a new transaction
        db.session.begin_nested()
        
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, email=email, password=hashed_pw)
        
        # Add the user and flush to check for unique constraint violations
        db.session.add(user)
        db.session.flush()
        
        # If we get here, no unique constraint violations occurred
        db.session.commit()
        print(f"Successfully registered user: {username}")
        return jsonify({
            'success': True,
            'message': 'User registered successfully.'
        }), 201  # Created
        
    except IntegrityError as e:
        # Roll back the transaction
        db.session.rollback()
        print(f"Registration failed with integrity error: {str(e)}")
        if 'UNIQUE constraint failed: users.email' in str(e):
            return jsonify({
                'success': False,
                'message': 'Email already registered.'
            }), 400  # Bad Request
        elif 'UNIQUE constraint failed: users.username' in str(e):
            return jsonify({
                'success': False,
                'message': 'Username already taken.'
            }), 400  # Bad Request
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500  # Internal Server Error
    except Exception as e:
        # Roll back the transaction
        db.session.rollback()
        print(f"Registration failed with error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500  # Internal Server Error

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    login_identifier = data.get('login_identifier')  # Can be either username or email
    password = data.get('password')
    
    if not login_identifier or not password:
        return jsonify({'success': False, 'message': 'Please provide both username/email and password.'}), 400
    
    # Try to find user by username or email
    user = User.query.filter(
        db.or_(
            User.username == login_identifier,
            User.email == login_identifier
        )
    ).first()
    
    if not user:
        return jsonify({'success': False, 'message': 'Invalid username/email or password.'}), 401
        
    if bcrypt.check_password_hash(user.password, password):
        login_user(user)
        return jsonify({
            'success': True, 
            'message': 'Logged in successfully.',
            'username': user.username
        })
    return jsonify({'success': False, 'message': 'Invalid username/email or password.'}), 401

# Logout endpoint@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out.'})

# Check login status
@app.route('/check', methods=['GET'])
def check():
    if current_user.is_authenticated:
        return jsonify({
            'logged_in': True, 
            'email': current_user.email,
            'username': current_user.username
        })
    return jsonify({'logged_in': False})

@app.route('/test-cors')
def test_cors():
    return jsonify({'message': 'CORS is working!'})

@app.route('/tables')
def tables():
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    return jsonify({'tables': inspector.get_table_names()})

@app.route('/check-password', methods=['POST'])
def check_password():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if bcrypt.check_password_hash(user.password, password):
        return jsonify({'success': True, 'message': 'Password is correct'})
    else:
        return jsonify({'success': False, 'message': 'Password is incorrect'})

@app.route('/')
def index():
    return app.send_static_file('ultimate.html')

@app.route('/reset.html')
def reset_page():
    return app.send_static_file('reset.html')

@app.route('/request-reset', methods=['POST'])
def request_password_reset():
    try:
        data = request.get_json()
        email = data.get('email')
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Check rate limit (1 request per minute per email)
        current_time = datetime.now()
        if email in reset_requests:
            last_request = reset_requests[email]
            if current_time - last_request < timedelta(minutes=1):
                return jsonify({
                    'success': False,
                    'message': 'Please wait a minute before requesting another reset link'
                }), 429
        
        # Update last request time
        reset_requests[email] = current_time
        
        # Generate reset token
        reset_token = s.dumps(email, salt='password-reset-salt')
        
        # Send password reset email
        success, message = email_service.send_password_reset_email(email, reset_token)
        if not success:
            return jsonify({'success': False, 'message': f'Error sending reset email: {message}'}), 500
        
        return jsonify({'success': True, 'message': 'Password reset email sent successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'success': False, 'message': 'Invalid request'}), 400
            
        # Verify token
        email = s.loads(token, salt='password-reset-salt', max_age=3600)
        
        # Update user's password
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
        user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Password successfully changed! You can now login.'})
    except SignatureExpired:
        return jsonify({'success': False, 'message': 'The reset link has expired'}), 400
    except BadSignature:
        return jsonify({'success': False, 'message': 'Invalid reset token'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        # Only create tables if they don't exist
        db.create_all()
        print("Database tables initialized successfully!")
        # Verify the table structure
        inspector = db.inspect(db.engine)
        for table_name in inspector.get_table_names():
            print(f"\nTable: {table_name}")
            for column in inspector.get_columns(table_name):
                print(f"Column: {column['name']}, Unique: {column.get('unique', False)}")
            for constraint in inspector.get_unique_constraints(table_name):
                print(f"Unique constraint: {constraint['name']} on columns: {constraint['column_names']}")
            for index in inspector.get_indexes(table_name):
                print(f"Index: {index['name']}, Unique: {index['unique']}, Columns: {index['column_names']}")
    app.run(debug=True, port=5004)
