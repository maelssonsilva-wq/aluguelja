const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor, forneça um nome'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor, forneça um email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, forneça um email válido']
  },
  password: {
    type: String,
    required: function() {
      // Senha é obrigatória apenas se não for login social
      return !this.googleId && !this.appleId;
    },
    minlength: [6, 'A senha deve ter no mínimo 6 caracteres'],
    select: false // Não retorna a senha por padrão nas queries
  },
  // Campos para OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: null
  },
  // Token para recuperação de senha
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Verificação de email
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  // Metadados
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Criptografar senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só criptografa se a senha foi modificada
  if (!this.isModified('password')) {
    return next();
  }
  
  // Gera salt e hash
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para gerar token de recuperação de senha
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  
  // Gera token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash do token e salva no banco
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Define expiração (10 minutos)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Método para retornar dados públicos do usuário
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.emailVerificationToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);
