const express = require("express");
const router = express.Router();
const {
  getBalance,
  deposit,
  withdraw,
  transfer,
  createAccount,
} = require("../controllers/accountsController");

// POST /create - Create a new account
router.post("/create", createAccount);

// GET /:accountNumber/balance - Retrieve account balance
router.get("/:accountNumber/balance", getBalance);

// POST /:accountNumber/deposit - Deposit funds into account
router.post("/:accountNumber/deposit", deposit);

// POST /:accountNumber/withdraw - Withdraw funds from account
router.post("/:accountNumber/withdraw", withdraw);

// POST /transfer - Transfer funds between accounts
router.post("/transfer", transfer);

module.exports = router;
