import smtplib, base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

def send_dios_email(payload: dict) -> dict:
    smtp_cfg = payload.get("smtp_config", {})
    sender_email = (smtp_cfg.get("sender_email") or "").strip()
    # Clean 16-digit key (remove spaces)
    app_key = (smtp_cfg.get("app_key") or "").replace(" ", "").strip()
    smtp_host = (smtp_cfg.get("host") or "smtp.gmail.com").strip()
    smtp_port = int(smtp_cfg.get("port") or 587)

    recipients = payload.get("recipients", [])
    if isinstance(recipients, str):
        recipients = [r.strip() for r in recipients.split(",") if r.strip()]

    if not sender_email:
        return {"success": False, "error": "Sender Email address is missing."}
    if not app_key:
        return {"success": False, "error": "Google 16-Digit Security Key is missing."}
    if not recipients or len(recipients) == 0:
        return {"success": False, "error": "No recipients specified."}

    subject = payload.get("subject", "DIOS Reports Submission - Udaipur HQ")
    body_text = payload.get("body", "Respected Sir,\n\nPlease find attached the official monthly review reports.\n\nRegards,\nBanwari Lal Meena (Udaipur HQ)")
    attachments = payload.get("attachments", [])

    try:
        msg = MIMEMultipart()
        msg["From"] = f"Banwari Lal Meena (DIOS) <{sender_email}>"
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject

        # Attach Body Text
        msg.attach(MIMEText(body_text, "plain", "utf-8"))

        # Attach real Excel / PDF files
        for att in attachments:
            fname = att.get("filename", "report.xlsx")
            b64_content = att.get("content_base64", "")
            if b64_content:
                try:
                    file_bytes = base64.b64decode(b64_content)
                    part = MIMEApplication(file_bytes, Name=fname)
                    part["Content-Disposition"] = f'attachment; filename="{fname}"'
                    msg.attach(part)
                except Exception as ex:
                    print(f"Attachment error for {fname}: {ex}")

        # Connect to Google SMTP using 16-digit App Key
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, app_key)
        server.sendmail(sender_email, recipients, msg.as_string())
        server.quit()

        return {
            "success": True,
            "message": f"Email successfully sent to {len(recipients)} recipient(s)!",
            "recipients": recipients,
            "attachments_count": len(attachments)
        }

    except smtplib.SMTPAuthenticationError:
        return {
            "success": False,
            "error": "Google Authentication Failed: Invalid 16-Digit Key or Email. Please check Google App Passwords Key."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"SMTP Dispatch Error: {str(e)}"
        }
