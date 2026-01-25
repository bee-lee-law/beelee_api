class CalculationUtils {
  // Convert meters to miles
  metersToMiles(meters) {
    return meters * 0.000621371;
  }

  // Convert meters to kilometers
  metersToKilometers(meters) {
    return meters / 1000;
  }

  // Convert miles to meters
  milesToMeters(miles) {
    return miles * 1609.34;
  }

  // Convert kilometers to meters
  kilometersToMeters(kilometers) {
    return kilometers * 1000;
  }

  // Calculate percentage
  calculatePercentage(part, total) {
    if (total === 0) return 0;
    return (part / total) * 100;
  }

  // Calculate average
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
  }

  // Round to decimal places
  roundToDecimals(number, decimals = 2) {
    return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
  }

  // Calculate grade/score letter
  getGradeLetter(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Normalize value to 0-100 range
  normalizeToScale(value, min, max) {
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  }
}

module.exports = new CalculationUtils();
