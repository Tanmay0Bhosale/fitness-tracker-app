const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
const Meal = require('./models/Meal');

const app = express();
app.set('view engine', 'ejs');

mongoose.connect('mongodb://127.0.0.1:27017/fitness-tracker');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true,
}));

// Helpers
function calculateBMI(weight, height) {
  return (weight / ((height / 100) ** 2)).toFixed(2);
}

function getGoalFromBMI(bmi) {
  const bmiVal = parseFloat(bmi);
  if (bmiVal < 18.5) return "Gain Weight";
  else if (bmiVal >= 18.5 && bmiVal < 25) return "Maintain Weight";
  else return "Lose Weight";
}

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, weight, height } = req.body;
  const user = new User({ name, weight, height });
  await user.save();
  req.session.user = user;
  res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/');

  const bmi = calculateBMI(user.weight, user.height);
  const goal = getGoalFromBMI(bmi);

  const meals = await Meal.find({ userId: user._id });

  // Calculate total calories per meal type (if possible)
  const mealData = meals.map(meal => ({
    food: meal.food,
    calories: meal.calories
  }));

  const labels = mealData.map(meal => meal.food);
  const data = mealData.map(meal => meal.calories);

  res.render('dashboard', { user, bmi, goal, meals, labels, data });
});

app.get('/meals/add', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('addMeal');
});

app.post('/meals/add', async (req, res) => {
  const { food, calories } = req.body;
  const user = req.session.user;

  if (!user) return res.redirect('/');

  try {
    const meal = new Meal({
      userId: user._id,
      food,
      calories
    });

    await meal.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Error saving meal:", err.message);
    res.status(500).send(`Error saving meal: ${err.message}`);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
