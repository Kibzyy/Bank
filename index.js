require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const pool = require("./db");

app.get("/api/accounts/:accountNumber/balance", async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const result = await pool.query(
      "SELECT balance FROM accounts WHERE account_number = $1",
      [accountNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({
      accountNumber,
      balance: result.rows[0].balance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const db = require("./db");

app.get("/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      message: "Database connected!",
      time: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});