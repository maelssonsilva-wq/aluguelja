require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota para servir a página de cadastro
app.get('/cadastro', (req, res) => {
  res.sendFile(__dirname + '/cadastro.html');
});

// Rota para servir a página principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Aluguel Imóveis - App de Aluguel Completo.html');
});

// Rota para cadastro de usuários
app.post('/api/cadastro', [
  body('name').trim().isLength({ min: 3 }).withMessage('O nome deve ter pelo menos 3 caracteres'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres'),
  body('confirm-password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('As senhas não conferem');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Verificar se o e-mail já está cadastrado
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está em uso' });
    }

    // Inserir novo usuário
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ error: 'Erro ao processar o cadastro' });
  }
});

// Rota para verificar se a API está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'API está funcionando' });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Testar conexão com o banco de dados
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Verificar se a tabela de usuários existe, se não, criá-la
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela de usuários verificada/criada com sucesso!');
    
    client.release();
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
}

testConnection();
