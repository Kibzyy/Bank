const pool = require('../db');
const bcrypt = require('bcryptjs');

/**
 * GET /:accountNumber/balance
 */
const getBalance = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    if (!accountNumber) return res.status(400).json({ error: "Account number required" });

    const result = await pool.query(
      'SELECT account_number, account_type, balance FROM accounts WHERE account_number = $1',
      [accountNumber]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Account not found" });

    const account = result.rows[0];
    res.json({
      accountNumber: account.account_number,
      accountType: account.account_type,
      balance: parseFloat(account.balance)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /:accountNumber/deposit
 */
const deposit = async (req, res) => {
  const { accountNumber } = req.params;
  const { amount } = req.body;

  if (!accountNumber) return res.status(400).json({ error: "Account number required" });
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    return res.status(400).json({ error: "Amount must be positive" });

  const depositAmount = parseFloat(amount);

  try {
    await pool.query('BEGIN');

    // Lock account row
    const accountResult = await pool.query(
      'SELECT id, balance FROM accounts WHERE account_number = $1 FOR UPDATE',
      [accountNumber]
    );

    if (accountResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Account not found" });
    }

    const account = accountResult.rows[0];
    const newBalance = parseFloat(account.balance) + depositAmount;

    await pool.query(
      'UPDATE accounts SET balance = $1 WHERE id = $2',
      [newBalance, account.id]
    );

    await pool.query(
      'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
      [account.id, 'DEPOSIT', depositAmount, 'Deposit via API']
    );

    await pool.query('COMMIT');

    res.json({ accountNumber, balance: newBalance });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /:accountNumber/withdraw
 */
const withdraw = async (req, res) => {
  const { accountNumber } = req.params;
  const { amount } = req.body;

  if (!accountNumber) return res.status(400).json({ error: "Account number required" });
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    return res.status(400).json({ error: "Amount must be positive" });

  const withdrawAmount = parseFloat(amount);

  try {
    await pool.query('BEGIN');

    // Lock account row
    const accountResult = await pool.query(
      'SELECT id, balance FROM accounts WHERE account_number = $1 FOR UPDATE',
      [accountNumber]
    );

    if (accountResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Account not found" });
    }

    const account = accountResult.rows[0];

    if (withdrawAmount > parseFloat(account.balance)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const newBalance = parseFloat(account.balance) - withdrawAmount;

    await pool.query(
      'UPDATE accounts SET balance = $1 WHERE id = $2',
      [newBalance, account.id]
    );

    await pool.query(
      'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
      [account.id, 'WITHDRAW', withdrawAmount, 'Withdraw via API']
    );

    await pool.query('COMMIT');

    res.json({ accountNumber, balance: newBalance });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /transfer
 */
const transfer = async (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;

  if (!fromAccount || !toAccount || !amount)
    return res.status(400).json({ error: "fromAccount, toAccount and amount required" });
  if (fromAccount === toAccount) return res.status(400).json({ error: "Cannot transfer to same account" });
  if (parseFloat(amount) <= 0) return res.status(400).json({ error: "Amount must be positive" });

  const transferAmount = parseFloat(amount);

  try {
    await pool.query('BEGIN');

    // Lock both accounts
    const fromResult = await pool.query(
      'SELECT id, balance FROM accounts WHERE account_number = $1 FOR UPDATE',
      [fromAccount]
    );
    const toResult = await pool.query(
      'SELECT id, balance FROM accounts WHERE account_number = $1 FOR UPDATE',
      [toAccount]
    );

    if (fromResult.rows.length === 0 || toResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "One or both accounts not found" });
    }

    const from = fromResult.rows[0];
    const to = toResult.rows[0];

    if (transferAmount > parseFloat(from.balance)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const newFromBalance = parseFloat(from.balance) - transferAmount;
    const newToBalance = parseFloat(to.balance) + transferAmount;

    await pool.query('UPDATE accounts SET balance = $1 WHERE id = $2', [newFromBalance, from.id]);
    await pool.query('UPDATE accounts SET balance = $1 WHERE id = $2', [newToBalance, to.id]);

    await pool.query(
      'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
      [from.id, 'TRANSFER', transferAmount, `Transfer to ${toAccount}`]
    );
    await pool.query(
      'INSERT INTO transactions (account_id, type, amount, reference) VALUES ($1, $2, $3, $4)',
      [to.id, 'TRANSFER', transferAmount, `Transfer from ${fromAccount}`]
    );

    await pool.query('COMMIT');

    res.json({
      fromAccount: { accountNumber: fromAccount, balance: newFromBalance },
      toAccount: { accountNumber: toAccount, balance: newToBalance }
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /create
 * Create a new account with PIN
 */
const createAccount = async (req, res) => {
  let { accountNumber, accountType, balance, pin } = req.body;

  if (!accountNumber || !accountType || !pin) {
    return res.status(400).json({ error: 'Account number, type, and PIN are required' });
  }

  accountNumber = accountNumber.trim();
  pin = pin.trim();

  if (isNaN(balance) || parseFloat(balance) < 0) {
    return res.status(400).json({ error: 'Balance must be a positive number' });
  }

  try {
    await pool.query('BEGIN');
    
    // Check if account already exists
    const existingAccount = await pool.query(
      'SELECT id FROM accounts WHERE account_number = $1',
      [accountNumber]
    );

    if (existingAccount.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Account already exists' });
    }

    // Create the account in the accounts table
    const accountResult = await pool.query(
      'INSERT INTO accounts (account_number, account_type, balance) VALUES ($1, $2, $3) RETURNING id',
      [accountNumber, accountType, parseFloat(balance)]
    );

    const accountId = accountResult.rows[0].id;

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pin, salt);

    // Create the user in the users table
    await pool.query(
      'INSERT INTO users (account_id, account_number, pin_hash) VALUES ($1, $2, $3)',
      [accountId, accountNumber, pinHash]
    );

    await pool.query('COMMIT');

    res.status(201).json({
      message: 'Account and user created successfully',
      accountNumber,
      accountType,
      balance: parseFloat(balance)
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getBalance, deposit, withdraw, transfer, createAccount };