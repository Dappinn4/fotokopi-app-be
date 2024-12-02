const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "mysql.railway.internal",
  user: "root",
  password: "ePxheXYgBlvSFQiFoUeScZvydXjpORLz",
  database: "railway",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to the database");
  }
});

module.exports = db;
