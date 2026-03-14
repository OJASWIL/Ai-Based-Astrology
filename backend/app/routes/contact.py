from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
import traceback
import ssl

contact_bp = Blueprint("contact", __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Email configuration from environment variables
CONTACT_EMAIL = os.environ.get("CONTACT_EMAIL", "supportjyotishai.com@gmail.com")
SMTP_EMAIL = os.environ.get("SMTP_EMAIL", CONTACT_EMAIL)
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))

# Log configuration (without showing full password)
logger.info(f"Email Configuration - Host: {SMTP_HOST}, Port: {SMTP_PORT}, Email: {SMTP_EMAIL}")
logger.info(f"Password set: {'Yes' if SMTP_PASSWORD else 'No'}")

SUBJECTS = {
    "general": "सामान्य जिज्ञासा",
    "support": "प्राविधिक सहयोग",
    "billing": "भुक्तानी प्रश्न",
    "consultation": "परामर्श अनुरोध",
    "feedback": "प्रतिक्रिया",
    "other": "अन्य",
}


def send_email(sender_name: str, sender_email: str, subject_key: str, message: str, user_id: str = None):
    """Send contact form email to support inbox."""
    subject_label = SUBJECTS.get(subject_key, subject_key)
    
    logger.info(f"Attempting to send email from {sender_email} to {CONTACT_EMAIL}")

    if not SMTP_PASSWORD:
        logger.error("SMTP_PASSWORD not set in environment variables")
        return False, "SMTP password not configured. Please check server configuration."

    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Jyotish AI] {subject_label} — {sender_name}"
        msg["From"] = SMTP_EMAIL
        msg["To"] = CONTACT_EMAIL
        msg["Reply-To"] = sender_email

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Create email body in both Nepali and English
        body = f"""नयाँ सम्पर्क सन्देश प्राप्त भयो! / New Contact Message Received!
{'='*60}

📋 विवरण / Details:
------------------------
नाम / Name:     {sender_name}
ईमेल / Email:   {sender_email}
विषय / Subject: {subject_label}
मिति / Date:    {current_time}
प्रयोगकर्ता ID / User ID: {user_id if user_id else 'N/A'}
------------------------

💬 सन्देश / Message:
------------------------
{message}
------------------------

यो सन्देश Jyotish AI को सम्पर्क फारमबाट पठाइएको हो।
This message was sent from the Jyotish AI contact form.

कृपया २४ घण्टाभित्र जवाफ दिनुहोस्।
Please respond within 24 hours.
{'='*60}
"""

        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Send email with detailed error handling
        logger.debug(f"Connecting to SMTP server {SMTP_HOST}:{SMTP_PORT}")
        
        # Create secure SSL context
        context = ssl.create_default_context()
        
        # Connect to server
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        server.set_debuglevel(1)  # Enable debug output
        
        try:
            server.starttls(context=context)
            logger.debug("TLS started")
            
            logger.debug(f"Attempting login with email: {SMTP_EMAIL}")
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            logger.debug("Login successful")
            
            logger.debug("Sending email")
            server.send_message(msg)
            logger.info(f"Email sent successfully to {CONTACT_EMAIL}")
            
            # Try to send confirmation email to user
            try:
                send_confirmation_email(sender_name, sender_email, subject_label)
            except Exception as e:
                logger.warning(f"Confirmation email failed but main email sent: {e}")
            
            return True, "Success"
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {e}")
            error_msg = str(e)
            if "Application-specific password required" in error_msg:
                return False, "Gmail requires an App Password. Please generate one in your Google Account settings."
            elif "Username and Password not accepted" in error_msg:
                return False, "Email or password incorrect. Please check your credentials."
            else:
                return False, f"Gmail authentication failed: {error_msg}"
                
        except smtplib.SMTPServerDisconnected as e:
            logger.error(f"Server disconnected: {e}")
            return False, "Connection to email server lost. Please try again."
            
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return False, f"Email server error: {str(e)}"
            
        finally:
            try:
                server.quit()
            except:
                pass

    except Exception as e:
        logger.error(f"Email send failed: {e}")
        logger.error(traceback.format_exc())
        return False, str(e)


def send_confirmation_email(user_name: str, user_email: str, subject: str):
    """Send confirmation email to the user."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Jyotish AI - तपाईंको सन्देश प्राप्त भयो / Your Message Has Been Received"
        msg["From"] = SMTP_EMAIL
        msg["To"] = user_email

        body = f"""प्रिय {user_name},

धन्यवाद! तपाईंको सन्देश सफलतापूर्वक प्राप्त भयो।

विषय: {subject}
मिति: {datetime.now().strftime('%Y-%m-%d %H:%M')}

हामीले तपाईंको सन्देश प्राप्त गरेका छौं र २४ घण्टाभित्र जवाफ पठाउनेछौं।

धन्यवाद,
Jyotish AI टोली

----------------------------------------

Dear {user_name},

Thank you! Your message has been received successfully.

Subject: {subject}
Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}

We have received your message and will respond within 24 hours.

Thank you,
Jyotish AI Team
"""

        msg.attach(MIMEText(body, "plain", "utf-8"))

        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.starttls(context=context)
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Confirmation email sent to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")
        raise  # Re-raise to be handled by caller


@contact_bp.route("/", methods=["POST"])
@jwt_required()
def submit_contact():
    """Submit contact form (authenticated endpoint)."""
    try:
        # Log received request
        logger.debug("Contact form submission received")
        
        # Get user ID from JWT token
        current_user_id = get_jwt_identity()
        logger.debug(f"User ID: {current_user_id}")
        
        # Get JSON data
        data = request.get_json()
        logger.debug(f"Request data: {data}")
        
        if not data:
            return jsonify({"error": "कृपया डाटा पठाउनुहोस्।"}), 400

        # Extract and validate fields
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        subject = data.get("subject", "general").strip()
        message = data.get("message", "").strip()

        logger.debug(f"Name: {name}, Email: {email}, Subject: {subject}, Message length: {len(message)}")

        # Validate required fields
        if not name:
            return jsonify({"error": "कृपया आफ्नो नाम लेख्नुहोस्।"}), 400
        
        if not email:
            return jsonify({"error": "कृपया आफ्नो इमेल ठेगाना लेख्नुहोस्।"}), 400
        
        if '@' not in email or '.' not in email:
            return jsonify({"error": "कृपया मान्य इमेल ठेगाना लेख्नुहोस्।"}), 400
        
        if not message:
            return jsonify({"error": "कृपया सन्देश लेख्नुहोस्।"}), 400
        
        if len(message) < 10:
            return jsonify({"error": "सन्देश कम्तिमा १० अक्षर हुनुपर्छ।"}), 400

        # Check if email configuration exists
        if not SMTP_PASSWORD:
            logger.error("SMTP_PASSWORD not configured")
            return jsonify({
                "error": "इमेल सेवा ठीक से कन्फिगर गरिएको छैन। कृपया प्रशासकलाई सम्पर्क गर्नुहोस्।"
            }), 500

        # Send email
        success, error_msg = send_email(name, email, subject, message, current_user_id)
        
        if success:
            logger.info(f"Contact message sent successfully from {email}")
            return jsonify({
                "success": True,
                "message": "तपाईंको सन्देश सफलतापूर्वक पठाइयो! हामी २४ घण्टाभित्र सम्पर्क गर्नेछौं।"
            }), 200
        else:
            logger.error(f"Failed to send email: {error_msg}")
            
            # Return user-friendly error message
            if "Gmail authentication failed" in error_msg:
                return jsonify({
                    "error": "इमेल प्रमाणीकरण असफल भयो। कृपया पछि फेरि प्रयास गर्नुहोस् वा प्रशासकलाई सम्पर्क गर्नुहोस्।"
                }), 500
            else:
                return jsonify({
                    "error": f"सन्देश पठाउन समस्या भयो। कृपया पछि फेरि प्रयास गर्नुहोस्।"
                }), 500

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "सर्भरमा समस्या भयो। कृपया पछि फेरि प्रयास गर्नुहोस्।"}), 500


@contact_bp.route("/public", methods=["POST"])
def submit_contact_public():
    """Public endpoint for contact form (no authentication required)."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "कृपया डाटा पठाउनुहोस्।"}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        subject = data.get("subject", "general").strip()
        message = data.get("message", "").strip()

        # Validate
        if not name or not email or not message:
            return jsonify({"error": "नाम, इमेल र सन्देश आवश्यक छ।"}), 400

        if len(message) < 10:
            return jsonify({"error": "सन्देश कम्तिमा १० अक्षर हुनुपर्छ।"}), 400

        success, error_msg = send_email(name, email, subject, message)
        
        if success:
            return jsonify({
                "success": True,
                "message": "तपाईंको सन्देश सफलतापूर्वक पठाइयो!"
            }), 200
        else:
            return jsonify({"error": "सन्देश पठाउन समस्या भयो। कृपया पछि फेरि प्रयास गर्नुहोस्।"}), 500

    except Exception as e:
        logger.error(f"Error in public contact: {e}")
        return jsonify({"error": "सर्भरमा समस्या भयो।"}), 500


@contact_bp.route("/info", methods=["GET"])
def get_contact_info():
    """Public endpoint — contact info."""
    return jsonify({
        "contact": {
            "email": CONTACT_EMAIL,
            "phone": "+977 9801234567",
            "address": "Kathmandu, Nepal",
            "hours": "९:०० बिहान - ६:०० साँझ (NST)",
            "response": "२४ घण्टाभित्र जवाफ",
        }
    }), 200


@contact_bp.route("/test", methods=["GET"])
def test_email_config():
    """Test endpoint to verify email configuration."""
    config_status = {
        "SMTP_EMAIL": SMTP_EMAIL,
        "SMTP_HOST": SMTP_HOST,
        "SMTP_PORT": SMTP_PORT,
        "SMTP_PASSWORD_SET": bool(SMTP_PASSWORD),
        "CONTACT_EMAIL": CONTACT_EMAIL
    }
    
    if not SMTP_PASSWORD:
        return jsonify({
            "status": "error",
            "message": "SMTP_PASSWORD not configured",
            "config": config_status
        }), 500
    
    # Try a simple connection test
    try:
        context = ssl.create_default_context()
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls(context=context)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.quit()
        
        return jsonify({
            "status": "success",
            "message": "Email configuration is working",
            "config": config_status
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Connection test failed: {str(e)}",
            "config": config_status
        }), 500