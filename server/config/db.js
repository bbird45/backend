const mysql = require('mysql2/promise');

// สร้าง Connection Pool
const pool = mysql.createPool({
  uri: process.env.DB_URI,
  connectionLimit: 10, 
});

module.exports = pool;
