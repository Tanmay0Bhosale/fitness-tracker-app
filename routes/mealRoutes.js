const express = require('express');
const { addMeal, getMeals } = require('../controllers/mealController');
const router = express.Router();

router.post('/add', addMeal);
router.get('/', getMeals);
module.exports = router;
