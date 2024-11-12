// counter.js
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 0 }
});

// Define methods on the schema if needed
counterSchema.statics.getNextSequence = async function(sequenceName) {
    const result = await this.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return result.sequence_value;
};

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
