const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// Rotas
app.use('/api/auth', authRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API Casa na Mão está funcionando!' });
});

// Rota para verificação de email (pode ser uma página HTML bonita)
app.get('/verificar-email', (req, res) => {
  res.render('verification-success', { 
    title: 'Email Verificado',
    message: 'Seu email foi verificado com sucesso! Agora você pode fazer login.'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Algo deu errado!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});