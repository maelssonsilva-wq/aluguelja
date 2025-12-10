require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const connectDB = require('./config/database');

// Inicializa app
const app = express();

// Conecta ao banco de dados
connectDB();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Autenticação - Imóveis Prime',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'PUT /api/auth/reset-password/:token',
      verifyEmail: 'GET /api/auth/verify-email/:token',
      googleAuth: 'GET /api/auth/google',
      logout: 'POST /api/auth/logout'
    }
  });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Inicia servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
