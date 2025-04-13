const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  weight: Number,
  height: Number
});

module.exports = mongoose.model('User', userSchema);
