const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'please_change_this_secret';

router.post('/register', [
  body('username').notEmpty().withMessage('username required'),
  body('password').isLength({ min: 6 }).withMessage('password min 6')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { username, password, email } = req.body;
  try {
    const exists = await User.findOne({ where: { username } });
    if (exists) return res.status(400).json({ error: 'Usuario ya existe' });
    const user = await User.create({ username, password, email });
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en login' });
  }
});

module.exports = router;
