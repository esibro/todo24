const osc = require('osc');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Todo = require('./todolist.js');

// Create an Express app
const app = express();
const server = http.createServer(app);

// connect to mongodb
const dbURI = 'mongodb+srv://esmaguersoy:i8Qxe0p4tk2q2zoV@affectivetodo.b0aja.mongodb.net/todolist?retryWrites=true&w=majority&appName=affectivetodo';
mongoose.connect(dbURI)
.then((result) => console.log('connected to mongodb'))
.catch((err) => console.log(err));



// Setup Socket.IO with CORS options
const io = socketIo(server, {
    cors: {
      origin: "http://localhost:4200", // Angular app's origin
      methods: ["GET", "POST"],
      credentials: true // Allow credentials (cookies, etc.), if needed
    }
  });

  // Enable CORS for all routes
app.use(cors({
    origin: "http://localhost:4200", // Angular app's origin
    methods: ["GET", "POST"],
    credentials: true
  }));

// Listen for incoming OSC messages
const udpPort = new osc.UDPPort({
    localAddress: "localhost",
    localPort: 12345 // Port where OSC data is coming in
});

/* udpPort.on("message", function (oscMsg) {
    console.log("Received OSC message", oscMsg);
    // Send the OSC message to the frontend through WebSocket
    io.emit('oscData', oscMsg);
}); */

udpPort.open();

// Buffer to store the first 15 unique OSC messages
let oscBuffer = [];
let uniqueAddresses = new Set(); // Track unique addresses

// Listen for incoming OSC messages and add them to the buffer
udpPort.on("message", function (oscMsg) {
  const { address } = oscMsg;

  // Only add the first 16 unique addresses
  if (oscBuffer.length < 16 && !uniqueAddresses.has(address)) {
    oscBuffer.push(oscMsg);  // Add message to buffer
    uniqueAddresses.add(address);  // Track the unique address
    console.log("Added OSC message:", oscMsg);
  }
});

// Function to send the first 15 unique OSC messages every 15 seconds
function sendSampledData() {
  if (oscBuffer.length > 0) {
    // Emit the buffer with the first 15 addresses to the Angular client
    io.emit('oscData', oscBuffer);
    console.log('Sent sampled data to client:', oscBuffer);
    // Clear the buffer and the set after sending
    oscBuffer = [];
    uniqueAddresses.clear();
  } else {
    //console.log('No data available in buffer for sampling.');
  }
}

// Send the first 15 unique OSC addresses every 15 seconds (15000 milliseconds)
setInterval(sendSampledData, 15000);

// Serve Angular frontend
app.use(express.static(__dirname + '/dist/todo24'));

// WebSocket connection
io.on('connection', (socket) => {
    console.log('connected to WebSocket!');

  /*   // DISPLAY TODOS

    // Fetch all todos when requested
  socket.on('fetchTodos', async () => {
    try {
      const todos = await Todo.find();
      socket.emit('todos', todos);  // Send todos back to the client
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }); */



    // UPDATE TODO

        // Update todo's done status
  socket.on('updateTodoStatus', async (data) => {
    console.log('Received update request for ID:', data.taskId);

    try {
      // Ensure the ID is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(data.taskId)) {
        socket.emit('updateConfirmed', { success: false, message: 'Invalid todo ID.' });
        console.log('Invalid ID Update');
        return;
      }

      // Update the todo's done field to true
      const result = await Todo.findOneAndUpdate(
        { taskId: data.taskId },
        { done: data.done }, // Set the done field to true or false based on the client
        { new: true } // Return the updated document
      );

      if (result) {
        console.log('Todo updated:', result);
        socket.emit('updateConfirmed', { success: true, message: 'Todo updated successfully.', todo: result });
        console.log('Todo Updated.');
      } else {
        socket.emit('updateConfirmed', { success: false, message: 'Todo not found.' });
        onsole.log('Todo not found.');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      socket.emit('updateConfirmed', { success: false, message: 'Error updating todo.' });
      onsole.log('Todo not updated.');
    }
  }); 


  // DELETE TODO

  // Delete todo by ID
 socket.on('deleteTodo', async (data) => {
  try {
    // Ensure the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(data.taskId)) {
      socket.emit('deleteConfirmed', { success: false, message: 'Invalid todo ID.' });
      console.log('Invalid ID');
      return;
    } else {console.log('Valid ID');}

    // Delete the todo using findOneAndDelete
    const result = await Todo.findOneAndDelete({ taskId: data.taskId });

    if (result) {
      // If deletion was successful, send a confirmation back
      socket.emit('deleteConfirmed', { success: true, message: 'Todo deleted successfully.' });
      console.log('Todo deleted successfully');
    } else {
      socket.emit('deleteConfirmed', { success: false, message: 'Todo not found.' });
      console.log('Todo not found');
    }
  } catch (error) {
    socket.emit('deleteConfirmed', { success: false, message: 'Error deleting todo.' });
    console.error('Error deleting todo:', error);
  }   }); 



  // SAVE TODO

     // When receiving data from the client
socket.on('todoData', async (data) => {
  console.log('Received data:', data);

  // Store the data in MongoDB
  const todo = new Todo(data);
  await todo.save();

  // Acknowledge receipt to the client
  socket.emit('dataReceived', { success: true });

});


  // Send data or respond to events from the client
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});



