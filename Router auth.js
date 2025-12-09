const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);

module.exports = router;