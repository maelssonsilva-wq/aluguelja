const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    
    // Criar tabela de usuários se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(100) NOT NULL,
        token_verificacao VARCHAR(100),
        email_verificado BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela de usuários verificada/criada com sucesso!');
    
    client.release();
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
};

// Testar a conexão ao iniciar
testConnection();

module.exports = {
  query: (text, params) => pool.query(text, params),
};