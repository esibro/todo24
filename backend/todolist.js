const mongoose = require('mongoose');
const Schema = mongoose.Schema;

 // Define a schema for the todo item
const todoSchema = new mongoose.Schema({
    taskId: Number,
    description: String,
    difficulty: Number,
    done: Boolean
});
      
const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
      