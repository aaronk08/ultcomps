import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email configuration
smtp_server = 'smtp.gmail.com'
port = 587
username = 'aaronkershaw36@gmail.com'
password = 'kxkr sxzm zulv vfqq'

# Create message
msg = MIMEMultipart()
msg['From'] = username
msg['To'] = username
msg['Subject'] = 'Test Email'

body = 'This is a test email using smtplib'
msg.attach(MIMEText(body, 'plain'))

try:
    # Connect to server
    server = smtplib.SMTP(smtp_server, port)
    server.starttls()
    
    # Login
    server.login(username, password)
    
    # Send email
    server.send_message(msg)
    print("Email sent successfully!")
    
except Exception as e:
    print(f"Error sending email: {str(e)}")
finally:
    server.quit()
