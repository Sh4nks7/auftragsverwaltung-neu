import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test der Datenbankverbindung
pool.query('SELECT 1')
  .then(() => console.log('Datenbankverbindung erfolgreich'))
  .catch((err) => console.error('Datenbankverbindung fehlgeschlagen:', err));

export default pool;