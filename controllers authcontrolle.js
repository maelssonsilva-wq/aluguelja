const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail, resetPasswordTemplate, verifyEmailTemplate } = require('../utils/sendEmail');

// Gera JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça nome, email e senha.'
      });
    }

    // Verifica se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado.'
      });
    }

    // Cria usuário
    const user = await User.create({
      name,
      email,
      password
    });

    // Gera token de verificação de email
    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    await user.save();

    // Envia email de verificação
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verifique seu email - Imóveis Prime',
        html: verifyEmailTemplate(verifyUrl, user.name)
      });
    } catch (error) {
      console.error('Erro ao enviar email de verificação:', error);
    }

    // Gera token JWT
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso! Verifique seu email.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar usuário.',
      error: error.message
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça email e senha.'
      });
    }

    // Busca usuário (incluindo senha)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos.'
      });
    }

    // Verifica se é login social (não tem senha)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Esta conta usa login social. Por favor, use Google ou Apple.'
      });
    }

    // Verifica senha
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos.'
      });
    }

    // Atualiza último login
    user.lastLogin = Date.now();
    await user.save();

    // Gera token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login.',
      error: error.message
    });
  }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário.',
      error: error.message
    });
  }
};

// @desc    Solicitar redefinição de senha
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Não existe usuário com este email.'
      });
    }

    // Gera token de reset
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Cria URL de reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Redefinição de Senha - Imóveis Prime',
        html: resetPasswordTemplate(resetUrl, user.name)
      });

      res.status(200).json({
        success: true,
        message: 'Email de redefinição enviado com sucesso!'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação.',
      error: error.message
    });
  }
};

// @desc    Redefinir senha
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Hash do token recebido
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Busca usuário com token válido
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado.'
      });
    }

    // Define nova senha
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Gera novo token JWT
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso!',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha.',
      error: error.message
    });
  }
};

// @desc    Verificar email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({ emailVerificationToken });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação inválido.'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verificado com sucesso!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar email.',
      error: error.message
    });
  }
};

// @desc    Logout (invalidar token - implementar blacklist se necessário)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // Em uma API REST stateless, o logout é feito no frontend removendo o token
  // Aqui você pode implementar uma blacklist de tokens se necessário
  res.status(200).json({
    success: true,
    message: 'Logout realizado com sucesso!'
  });
};
