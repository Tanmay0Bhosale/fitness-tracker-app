const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
const Meal = require('./models/Meal');
const bcrypt = require('bcryptjs');

const Water = require('./models/Water');
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

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.send('User not found. Please sign up first.');
    }

    // Compare entered password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send('Invalid credentials.');
    }

    // If login successful, store user ID in session
    req.session.userId = user._id;

    // Redirect to BMI page or dashboard
    if (!user.height || !user.weight) {
      return res.redirect('/bmi'); // Redirect to BMI registration if not already filled
    }
    res.redirect('/dashboard'); // If BMI exists, go to the dashboard
  } catch (err) {
    console.error('Login Error:', err);
    res.send('Error during login');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send('User already exists. Please login.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    req.session.userId = user._id;
    res.redirect('/bmi'); // redirect to BMI registration
  } catch (err) {
    console.error('Signup Error:', err);
    res.send('Error during signup');
  }
});

app.get('/bmi', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('bmi'); // make sure bmi.ejs exists in the views folder
});

// POST /bmi (handle saving BMI data)
app.post('/bmi', async (req, res) => {
  const { height, weight } = req.body;

  // Make sure user is logged in
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    // Find user by their session ID
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/login');
    }

    // Save BMI data
    user.height = height;
    user.weight = weight;
    user.bmi = weight / ((height / 100) ** 2); // BMI formula
    await user.save();

    // Redirect to the dashboard after saving
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error saving BMI:', err);
    res.send('Error saving BMI data');
  }
});

// Route to display dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) {
    console.log("No session found, redirecting to login");
    return res.redirect('/login');
  }

  try {
    console.log("Fetching user...");
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log("User not found");
      return res.redirect('/login');
    }

    console.log("Fetching meals...");
    const meals = await Meal.find({ userId: req.session.userId });

    console.log("Setting time boundaries...");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log("Fetching water logs...");
    const waterLogs = await Water.find({
      userId: req.session.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log("Calculating total water intake...");
    const totalWaterIntake = waterLogs.reduce((sum, log) => sum + log.amount, 0);

    console.log("Calculating water goal...");
    let waterGoal = 3000; // Default goal
    if (user.bmi) {
      const bmi = user.bmi;
      if (bmi < 18.5) waterGoal = 2500;
      else if (bmi >= 18.5 && bmi < 25) waterGoal = 3000;
      else waterGoal = 3500;
    }

    console.log("Rendering dashboard...");
    res.render('dashboard', {
      user,
      meals,
      totalWaterIntake,
      waterGoal
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error retrieving dashboard data");
  }
});




// Route to display add meal form
app.get('/meals/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('addMeal');
});

// POST /meals/add (handle adding new meal)
app.post('/meals/add', async (req, res) => {
  const { name, food, calories } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.redirect('/login');

  try {
    const meal = new Meal({
      userId,
      name,        // Add the 'name' field
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
// GET: View water intake page
app.get('/water', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const waterLogs = await Water.find({
    userId: req.session.userId,
    date: { $gte: todayStart, $lte: todayEnd }
  });

  res.render('water', { waterLogs });
});

// POST: Add water intake
app.post('/water', async (req, res) => {
  const { amount } = req.body;
  if (!req.session.userId) return res.redirect('/login');

  try {
    const entry = new Water({
      userId: req.session.userId,
      amount: parseInt(amount)
    });

    await entry.save();
    res.redirect('/water');
  } catch (err) {
    console.error('Water log error:', err);
    res.status(500).send('Could not save water log');
  }
});


// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
