const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ 
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios' 
      });
    }

    const user = await User.create({
      nome,
      email,
      senha
    });

    // Enviar email de verificação
    try {
      await sendVerificationEmail(user.email, user.nome, user.token_verificacao);
    } catch (emailError) {
      console.error('Erro ao enviar email de verificação:', emailError);
    }

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso! Verifique seu email para ativar sua conta.',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        email_verificado: false
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao registrar usuário' 
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Token de verificação não fornecido' 
      });
    }

    const user = await User.verifyEmailToken(token);

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Token inválido ou expirado' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Email verificado com sucesso! Agora você pode fazer login.' 
    });
  } catch (error) {
    console.error('Erro na verificação de email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao verificar o endereço de email' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ 
        success: false,
        message: 'Por favor, forneça email e senha' 
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    const isMatch = await User.verifyPassword(user, senha);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    if (!user.email_verificado) {
      return res.status(403).json({ 
        success: false,
        message: 'Por favor, verifique seu email antes de fazer login' 
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao fazer login' 
    });
  }
};