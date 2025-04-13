function calculateBMI(weight, height) {
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    let goal = '';
  
    if (bmi < 18.5) goal = 'Gain weight';
    else if (bmi >= 18.5 && bmi <= 24.9) goal = 'Maintain weight';
    else goal = 'Lose weight';
  
    return { bmi: parseFloat(bmi.toFixed(2)), goal };
  }
  
  module.exports = calculateBMI;
  