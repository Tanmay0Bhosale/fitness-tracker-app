const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  food: {
    type: String,
    required: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now, // Automatically set to the current date and time
  },
});

module.exports = mongoose.model('Meal', mealSchema);
