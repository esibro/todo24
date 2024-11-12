const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  eda_baseline: { type: Number, required: true},
  hr_baseline: { type: Number, required: true}
});

const User = mongoose.model('User', userSchema);
module.exports = User;