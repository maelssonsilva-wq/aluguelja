const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const renderTemplate = async (template, data) => {
    try {
        const templatePath = path.join(__dirname, '../templates', `${template}.ejs`);
        return await ejs.renderFile(templatePath, data);
    } catch (error) {
        console.error('Erro ao renderizar o template de email:', error);
        throw error;
    }
};

exports.sendVerificationEmail = async (to, nome, token) => {
    try {
        const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
        
        const html = await renderTemplate('verification-email', {
            nome,
            url: verificationUrl,
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject: 'Verifique seu endereço de email - Casa na Mão',
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email de verificação enviado para: ${to}`);
    } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        throw new Error('Falha ao enviar email de verificação');
    }
};