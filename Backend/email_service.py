import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

logger = logging.getLogger(__name__)


def send_notification_email(name: str, email: str, subject: str, message: str) -> None:
    if not settings.smtp_password:
        logger.warning(f"SMTP_PASSWORD not set — skipping email from {email}")
        return

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
            s.ehlo(); s.starttls(); s.ehlo()
            s.login(settings.smtp_user, settings.smtp_password)

            # 1. Notify owner
            owner = MIMEMultipart("alternative")
            owner["Subject"] = f"[Portfolio] {subject} — from {name}"
            owner["From"]    = f"Portfolio <{settings.smtp_user}>"
            owner["To"]      = settings.owner_email
            owner["Reply-To"] = f"{name} <{email}>"
            owner.attach(MIMEText(
                f"Name: {name}\nEmail: {email}\nSubject: {subject}\n\n{message}", "plain"
            ))
            owner.attach(MIMEText(f"""
<html><body style="font-family:sans-serif;background:#0a0a0f;color:#f0f0ff;padding:24px">
  <div style="max-width:560px;margin:auto;background:#13131f;border-radius:12px;overflow:hidden;border:1px solid rgba(108,99,255,.2)">
    <div style="background:linear-gradient(135deg,#6c63ff,#ff6584);padding:20px 24px">
      <h2 style="margin:0;color:#fff">📬 New Portfolio Message</h2>
    </div>
    <div style="padding:24px">
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Email:</strong> <a href="mailto:{email}" style="color:#6c63ff">{email}</a></p>
      <p><strong>Subject:</strong> {subject}</p>
      <div style="background:#0a0a0f;border-left:3px solid #6c63ff;padding:16px;border-radius:8px;margin-top:16px">
        <p style="margin:0;white-space:pre-wrap">{message}</p>
      </div>
      <a href="mailto:{email}?subject=Re: {subject}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:linear-gradient(135deg,#6c63ff,#8b5cf6);color:#fff;border-radius:50px;text-decoration:none;font-weight:600">
        ↩ Reply to {name}
      </a>
    </div>
  </div>
</body></html>""", "html"))
            s.sendmail(settings.smtp_user, settings.owner_email, owner.as_string())

            # 2. Confirm to sender
            if settings.send_confirmation_to_sender:
                conf = MIMEMultipart("alternative")
                conf["Subject"] = f"Got your message! Re: {subject}"
                conf["From"]    = f"Abhishek Pratap Singh <{settings.smtp_user}>"
                conf["To"]      = email
                conf.attach(MIMEText(
                    f"Hi {name},\n\nThanks for reaching out! I'll reply soon.\n\n— Abhishek", "plain"
                ))
                conf.attach(MIMEText(f"""
<html><body style="font-family:sans-serif;background:#0a0a0f;color:#f0f0ff;padding:24px">
  <div style="max-width:560px;margin:auto;background:#13131f;border-radius:12px;overflow:hidden;border:1px solid rgba(108,99,255,.2)">
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:20px 24px">
      <h2 style="margin:0;color:#fff">✅ Message Received!</h2>
    </div>
    <div style="padding:24px">
      <p>Hey <strong>{name}</strong> 👋</p>
      <p>Got your message and will reply to <strong>{email}</strong> as soon as possible.</p>
      <div style="background:#0a0a0f;border-left:3px solid #667eea;padding:16px;border-radius:8px;margin-top:16px">
        <p style="margin:0;font-style:italic;white-space:pre-wrap">{message}</p>
      </div>
      <p style="margin-top:20px">— Abhishek Pratap Singh</p>
    </div>
  </div>
</body></html>""", "html"))
                s.sendmail(settings.smtp_user, email, conf.as_string())

        logger.info(f"Emails sent for contact from {email}")

    except smtplib.SMTPAuthenticationError:
        logger.error("Gmail auth failed — use an App Password, not your account password.")
    except Exception as e:
        logger.error(f"Email error: {e}")
