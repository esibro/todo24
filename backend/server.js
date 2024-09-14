const osc = require('osc');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Create an Express app
const app = express();
const server = http.createServer(app);
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

  // Only add the first 15 unique addresses
  if (oscBuffer.length < 15 && !uniqueAddresses.has(address)) {
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
    console.log('No data available in buffer for sampling.');
  }
}

// Send the first 15 unique OSC addresses every 15 seconds (15000 milliseconds)
setInterval(sendSampledData, 15000);

// Serve Angular frontend
app.use(express.static(__dirname + '/dist/todo24')); // Replace with your Angular dist folder

// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected');

    // Optionally send data or respond to events from the client
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

