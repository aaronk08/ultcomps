import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Load environment variables
        self.smtp_host = os.getenv('MAILTRAP_HOST', 'smtp.mailtrap.io')
        self.smtp_port = int(os.getenv('MAILTRAP_PORT', '2525'))
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@ultimatecompetitions.com')
        self.username = os.getenv('MAILTRAP_USERNAME')
        self.password = os.getenv('MAILTRAP_PASSWORD')
        
        logger.debug(f'Email service initialized with: {self.smtp_host}:{self.smtp_port}')
        logger.debug(f'From email: {self.from_email}')
        logger.debug(f'Username: {self.username}')
    
    def send_password_reset_email(self, to_email, reset_token):
        try:
            logger.debug(f'Sending password reset email to: {to_email}')
            
            # Create message
            message = MIMEMultipart()
            message['From'] = self.from_email
            message['To'] = to_email
            message['Subject'] = 'Password Reset Request'
            
            # Create the reset link
            reset_link = f'http://localhost:5003/reset.html?token={reset_token}'
            
            # Create HTML email body
            html = f"""
            <html>
            <body>
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password. Click the link below to reset your password:</p>
                <p><a href="{reset_link}">{reset_link}</a></p>
                <p>If you did not request a password reset, please ignore this email.</p>
            </body>
            </html>
            """
            
            message.attach(MIMEText(html, 'html'))
            
            # Send email using Mailtrap SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(message)
            
            logger.debug('Email sent successfully')
            return True, 'Password reset email sent successfully'
        except Exception as e:
            logger.error(f'Error sending email: {str(e)}')
            return False, str(e)

# Create a global instance of the email service
email_service = EmailService()
