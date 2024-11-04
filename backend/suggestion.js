const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  trueValence: { type: Number, required: true },
  trueArousal: { type: Number, required: true },
  suggestedTasks: [
    {
      taskId: { type: Number, ref: 'Todo', required: true },
      description: { type: String, required: true }, // Use `description` from Todo model
    },
  ],
});

module.exports = mongoose.model('Suggestion', suggestionSchema);