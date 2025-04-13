const Meal = require('../models/Meal');

exports.addMeal = async (req, res) => {
  const { userId, food, calories } = req.body;
  const meal = new Meal({ userId, food, calories, time: new Date() });
  await meal.save();
  res.json(meal);
};

exports.getMeals = async (req, res) => {
  const { userId } = req.query;
  const meals = await Meal.find({ userId }).sort({ time: -1 });
  res.json(meals);
};
