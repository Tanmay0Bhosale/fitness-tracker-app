const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  height: Number,
  weight: Number,
  bmi: Number,
});

module.exports = mongoose.model('User', userSchema);