const mongoose = require('mongoose');
const host = 'localhost';
const dbName = 'airbuddy';
mongoose.connect(`mongodb://${host}/${dbName}`);

const db = mongoose.connection;

db.on('error', () => {
  console.log('mongoose connection error');
});

db.once('open', () => {
  console.log('mongoose connected successfully');
});

module.exports = db;