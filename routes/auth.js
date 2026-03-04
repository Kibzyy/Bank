const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /auth/register - Register new user
router.post('/register', register);

// POST /auth/login - Login user
router.post('/login', login);

module.exports = router;
