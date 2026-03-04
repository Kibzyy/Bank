require("dotenv").config();
const express = require("express");
const cors = require("cors");
const accountsRouter = require("./routes/accounts");
const authRouter = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Account Balance Management System - Server is running!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

module.exports = app;