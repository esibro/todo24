const osc = require('osc');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Todo = require('./todolist.js');
const SAM = require('./sam.js');
const EmotibitData = require('./emotibitData.js');
const checkForTodos = require('./taskSuggestion');
let dataReceived = false;
const Counter = require('./counter.js');
const User = require('./user.js');


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

udpPort.on("message", function (oscMsg) {
    //console.log("Received OSC message", oscMsg);
    // Send the OSC message to the frontend through WebSocket
    //io.emit('oscData', oscMsg);
    dataReceived = true;
});

// Function to check if data is being received
function isDataIncoming() {
  const incoming = dataReceived; // Check if data was received
  dataReceived = false; // Reset flag for the next interval check
  return incoming;
}

setInterval(() => {
  const streaming = isDataIncoming();
  
  // Emit the OSC streaming status to the client
  io.emit('oscStreaming', streaming);
  
  if (streaming) {
    //console.log("Data is incoming from the OSC stream.");
  } else {
    //console.log("No data received from the OSC stream.");
  }
}, 1000); // Check every second

udpPort.open();

let oscBuffer = {};

// Update the getNextTaskId function
async function getNextTaskId() {
  try {
      const counter = await Counter.getNextSequence('taskId');
      console.log('Generated new task ID:', counter);
      return counter;
  } catch (error) {
      console.error('Error generating task ID:', error);
      throw error;
  }
}

// Listen for incoming OSC messages and add their args to the corresponding address group
udpPort.on("message", function (oscMsg) {
  const { address, args } = oscMsg;

  // Initialize an array for this address if not already present
  if (!oscBuffer[address]) {
    oscBuffer[address] = [];
  }

  // Add the received args to the buffer for this address
  oscBuffer[address].push(...args);  // Spread the args array into individual elements
  //console.log(`Added OSC message for address ${address} with args: ${args}`);
});

// Function to calculate the mean of an array
function calculateMean(arr) {
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

// Function to send the mean of the args for each unique address every 30 seconds
function sendSampledData() {
  const result = {};

  // Loop over each address in the buffer and calculate the mean of the args
  for (let address in oscBuffer) {
    if (oscBuffer[address].length > 0) {
      const mean = calculateMean(oscBuffer[address]);
      result[address] = mean;  // Store the mean value for this address
      console.log(`Mean for address ${address}: ${mean}`);
    }
  }

  // Emit the result (mean of all addresses) to the Angular client
  io.emit('oscData', result);
  //console.log('Sent mean data to client:', result);

  // Clear the buffer for the next 30-second period
  oscBuffer = {};
}

// Send the first 2 unique OSC addresses every 30 seconds (30000 milliseconds)
setInterval(sendSampledData, 60000);

// Serve Angular frontend
app.use(express.static(__dirname + '/dist/todo24'));

// WebSocket connection
io.on('connection', (socket) => {
    console.log('connected to WebSocket!');

    socket.on('getUserName', async () => {
      try {
          const user = await User.findOne();
          
          if (user) {
              socket.emit('userName', { name: user.name });
          } else {
              console.log('No user found in database');
              socket.emit('userName', { name: 'User' });
          }
      } catch (error) {
          console.error('Error fetching user name:', error);
          socket.emit('userName', { name: 'User' });
      }
  });

    socket.on('fetchTodos', async () => {
      try {
          const todos = await Todo.find({});
          socket.emit('todos', todos);
          //console.log('Todos sent to client:', todos);
      } catch (error) {
          console.error('Error fetching todos:', error);
          socket.emit('todos', []);
      }
  });

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
        console.log('Todo not found.');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      socket.emit('updateConfirmed', { success: false, message: 'Error updating todo.' });
      console.log('Todo not updated.');
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

 // Update the todoData socket handler
 socket.on('todoData', async (data) => {
  console.log('Received todo data:', data);
  
  try {
      // Check if this exact todo already exists
      const existingTodo = await Todo.findOne({
          description: data.description,
          difficulty: data.difficulty,
          done: data.done
      });

      if (existingTodo) {
          console.log('Todo already exists, skipping creation');
          socket.emit('dataReceived', { 
              success: false, 
              error: 'Todo already exists'
          });
          return;
      }

      // Get the next taskId from the counter
      const taskId = await getNextTaskId();
      
      // Create new todo with the generated taskId
      const todo = new Todo({
          ...data,
          taskId: taskId
      });
      
      await todo.save();
      console.log('Saved todo with ID:', taskId);
      
      // Send back the saved todo with the new taskId
      socket.emit('dataReceived', { success: true, todo: todo });
      
  } catch (error) {
      console.error('Error saving todo:', error);
      socket.emit('dataReceived', { 
          success: false, 
          error: error.message 
      });
  }
});


// SAVE SAM DATA

// Listener for SAM data from frontend
socket.on('saveSAMData', async (data) => {
  try {
    const samEntry = new SAM(data);
    await samEntry.save();
    console.log('SAM data saved:', samEntry);

    // Get the mean of HR and EDA from the oscBuffer
    const hrAddress = '/EmotiBit/0/HR';   // Example OSC address for heart rate
    const edaAddress = '/EmotiBit/0/EDA'; // Example OSC address for EDA

    const hrMean = oscBuffer[hrAddress] ? calculateMean(oscBuffer[hrAddress]) : null;
    const edaMean = oscBuffer[edaAddress] ? calculateMean(oscBuffer[edaAddress]) : null;

    if (hrMean !== null && edaMean !== null) {
      // Create a new document in the EmotiBitData collection
      const emotibitData = new EmotibitData({
        hr: hrMean,
        eda: edaMean
      });

      await emotibitData.save();
      console.log('EmotiBit data saved:', emotibitData);

      // Send confirmation to the frontend
      socket.emit('emotibitDataSaved', { success: true, data: emotibitData });
    } else {
      console.error('HR or EDA mean data missing');
      socket.emit('emotibitDataSaved', { success: false, message: 'HR or EDA data missing' });
    }

    // Check if there are any todos
    await checkForTodos(socket);

  } catch (err) {
    console.error('Error saving SAM or EmotiBit data:', err);
      socket.emit('noTodos', { message: 'Error saving data.' });
  }
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


module.exports = isDataIncoming;