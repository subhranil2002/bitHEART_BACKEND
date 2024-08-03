const http = require('http');
const SerialPort = require('serialport');
const { WebSocketServer } = require('ws');
const express = require('express');
const app = express();
const port = 3000;

const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

wsServer.on('connection', (ws) => {
  console.log('New client connected');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.use(express.json());

const parsers = SerialPort.parsers;
const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const serialPort = new SerialPort('/dev/cu.usbmodem1301', {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false
});

serialPort.on('error', (err) => {
  console.error('Error opening serial port:', err.message);
});

serialPort.pipe(parser);

let latestData = "";

parser.on('data', (data) => {
  console.log('Received data from port:', data);
  latestData = data;
  wsServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
});

app.get('/api/data', (req, res) => {
  res.json({ message: latestData });
});

server.listen(port, () => {
  console.log("Server is running on http://localhost:${port}");
});