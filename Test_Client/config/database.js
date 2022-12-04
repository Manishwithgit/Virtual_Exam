var mysql = require('mysql');
var util = require('util');

var pool = mysql.createPool({multipleStatements: true,
  connectionLimit : 100,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test_old',
  charset: 'UTF8MB4_GENERAL_CI'
});

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query);

module.exports = pool;
