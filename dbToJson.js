require('dotenv').config();
const mysql = require('mysql');
const fs = require('fs');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

connection.connect();

connection.query('SELECT users_id, email FROM glpi_useremails', function (error, results, fields) {
  if (error) throw error;

  // Write down results to json
  fs.writeFileSync('users.json', JSON.stringify(results, null, 2));
});

connection.end();