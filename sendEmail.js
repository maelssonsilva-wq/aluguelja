const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Cria transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Define opções do email
  const mailOptions = {
    from: `"Imóveis Prime" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // Envia email
  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email');
  }
};

// Template para email de recuperação de senha
const resetPasswordTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Redefinição de Senha</h1>
        </div>
        <div class="content">
          <p>Olá ${userName || 'usuário'},</p>
          <p>Você solicitou a redefinição de senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #10B981;">${resetUrl}</p>
          <p><strong>Este link expira em 10 minutos.</strong></p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Imóveis Prime. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Template para email de verificação
const verifyEmailTemplate = (verifyUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo ao Imóveis Prime!</h1>
        </div>
        <div class="content">
          <p>Olá ${userName || 'usuário'},</p>
          <p>Obrigado por se cadastrar! Por favor, verifique seu email clicando no botão abaixo:</p>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verificar Email</a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #10B981;">${verifyUrl}</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 Imóveis Prime. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendEmail,
  resetPasswordTemplate,
  verifyEmailTemplate
};
