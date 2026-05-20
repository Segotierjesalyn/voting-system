const mysql = require('mysql2');

// Direkta nating ilalagay ang mga detalye para hindi na umasa sa .env file na hindi nababasa
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'voting-system', // 👈 Sinigurado nating MAY GITLING para tugma sa phpMyAdmin mo
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();