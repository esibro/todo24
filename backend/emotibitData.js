const mongoose = require('mongoose');

// Define the EmotiBit Data schema
const emotibitDataSchema = new mongoose.Schema({
  hr: { type: Number, required: true },       // Heart rate
  eda: { type: Number, required: true },      // Electrodermal activity
  timestamp: { type: Date, default: Date.now } // Timestamp of when the data was recorded
});

// Create and export the model
const EmotibitData = mongoose.model('EmotibitData', emotibitDataSchema);
module.exports = EmotibitData;