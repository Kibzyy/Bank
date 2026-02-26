const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = pool;

const { Pool } = require("pg");

const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "banking_system",
  password: "YOUR_PASSWORD",
  port: 5432,
});

module.exports = db;