// oscMonitor.js
const osc = require('osc');
let dataReceived = false; // Flag to track incoming data

// Create an OSC UDP Port
const udpPort = new osc.UDPPort({
    localAddress: "localhost",
    localPort: 12345
});

udpPort.on("message", function (oscMsg) {
    console.log("Received OSC message", oscMsg);
    dataReceived = true; // Set flag to true when data is received
});

udpPort.open();

// Function to check if OSC data is incoming
function isDataIncoming() {
    const incoming = dataReceived;
    dataReceived = false; // Reset flag for the next check
    return incoming;
}

