import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_email(to_email: str, subject: str, html_content: str):
    """Envia email usando SMTP"""
    try:
        # Cria mensagem
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email
        
        # Adiciona conteúdo HTML
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Conecta ao servidor SMTP
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        
        print(f"✅ Email enviado para {to_email}")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email: {str(e)}")
        return False

def reset_password_email(email: str, reset_url: str, user_name: str):
    """Template de email para redefinição de senha"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10B981; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Redefinição de Senha</h1>
        </div>
        <div class="content">
          <p>Olá {user_name},</p>
          <p>Você solicitou a redefinição de senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
          <p style="text-align: center;">
            <a href="{reset_url}" class="button">Redefinir Senha</a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #10B981;">{reset_url}</p>
          <p><strong>Este link expira em 10 minutos.</strong></p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Imóveis Prime. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    return send_email(email, "Redefinição de Senha - Imóveis Prime", html)

def verify_email_template(email: str, verify_url: str, user_name: str):
    """Template de email para verificação"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10B981; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo ao Imóveis Prime!</h1>
        </div>
        <div class="content">
          <p>Olá {user_name},</p>
          <p>Obrigado por se cadastrar! Por favor, verifique seu email clicando no botão abaixo:</p>
          <p style="text-align: center;">
            <a href="{verify_url}" class="button">Verificar Email</a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #10B981;">{verify_url}</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Imóveis Prime. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    return send_email(email, "Verifique seu email - Imóveis Prime", html)
