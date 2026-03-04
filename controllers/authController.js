const pool = require('../db');
const bcrypt = require('bcryptjs');

/**
 * POST /register
 * Register a new user with account number and PIN
 */
const register = async (req, res) => {
  const { accountNumber, pin } = req.body;

  if (!accountNumber || !pin) {
    return res.status(400).json({ error: 'Account number and PIN required' });
  }

  if (pin.length < 4) {
    return res.status(400).json({ error: 'PIN must be at least 4 characters' });
  }

  try {
    // Check if account exists
    const accountResult = await pool.query(
      'SELECT id FROM accounts WHERE account_number = $1',
      [accountNumber]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const accountId = accountResult.rows[0].id;

    // Check if user already registered
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE account_id = $1',
      [accountId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Account already registered' });
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (account_id, account_number, pin_hash) VALUES ($1, $2, $3) RETURNING id, account_number',
      [accountId, accountNumber, hashedPin]
    );

    res.status(201).json({
      message: 'Registration successful',
      accountNumber: result.rows[0].account_number
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /login
 * Authenticate user with account number and PIN
 */
const login = async (req, res) => {
  const { accountNumber, pin } = req.body;

  console.log('Login attempt for account:', accountNumber);
  console.log('PIN provided:', pin);

  if (!accountNumber || !pin) {
    return res.status(400).json({ error: 'Account number and PIN required' });
  }

  const trimmedAccount = accountNumber.toString().trim();
  const trimmedPin = pin.toString().trim();

  try {
    // Find user
    const result = await pool.query(
      'SELECT id, account_number, pin_hash FROM users WHERE account_number = $1',
      [trimmedAccount]
    );

    if (result.rows.length === 0) {
      console.log(`Login failed: Account ${trimmedAccount} not found in users table.`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('User found in DB:', user.account_number);
    console.log('Stored PIN hash:', user.pin_hash);

    // Verify PIN
    const pinMatch = await bcrypt.compare(trimmedPin, user.pin_hash);
    console.log('Do they match?', pinMatch);

    if (!pinMatch) {
      console.log(`Login failed: PIN mismatch for ${trimmedAccount}.`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user info
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        accountNumber: user.account_number
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };
