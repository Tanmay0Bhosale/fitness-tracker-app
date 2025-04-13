const User = require('../models/User');
const calculateBMI = require('../utils/bmiCalculator');

exports.registerUser = async (req, res) => {
  const { name, weight, height } = req.body;
  const { bmi, goal } = calculateBMI(weight, height);

  const user = new User({ name, weight, height, bmi, fitnessGoal: goal });
  await user.save();
  res.json(user);
};
