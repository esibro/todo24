const mongoose = require('mongoose');

// Define the SAM schema
const SAMSchema = new mongoose.Schema({
  arousal: { type: Number, required: true },
  valence: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const SAM = mongoose.model('SAM', SAMSchema);
module.exports = SAM;