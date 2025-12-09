const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

class User {
  static async create({ nome, email, senha }) {
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);
    const token_verificacao = uuidv4();

    const query = `
      INSERT INTO usuarios 
      (nome, email, senha_hash, salt, token_verificacao)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, nome, email_verificado;
    `;

    const values = [nome, email, senha_hash, salt, token_verificacao];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Email já está em uso');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async verifyPassword(user, senha) {
    return await bcrypt.compare(senha, user.senha_hash);
  }

  static async verifyEmailToken(token) {
    const query = `
      UPDATE usuarios 
      SET email_verificado = true, 
          token_verificacao = NULL,
          updated_at = NOW()
      WHERE token_verificacao = $1
      RETURNING id, email, nome, email_verificado;
    `;

    const result = await db.query(query, [token]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;