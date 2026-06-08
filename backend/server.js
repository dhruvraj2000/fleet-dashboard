const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const SimulationManager = require("./services/SimulationManager");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const simManager = new SimulationManager(io);
simManager.initialize();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send current simulation state on connection
  socket.emit("simulationStatus", { 
    running: simManager.simulationRunning, 
    speed: simManager.speedMultiplier 
  });

  // Send current trip data
  socket.emit("init", simManager.getCurrentState());

  socket.on("startSimulation", () => {
    console.log("Start request received");
    simManager.start();
  });

  socket.on("pauseSimulation", () => {
    console.log("Pause request received");
    simManager.pause();
  });

  socket.on("resetSimulation", () => {
    console.log("Reset request received");
    simManager.reset();
  });

  socket.on("setSimulationSpeed", (speed) => {
    console.log(`Set speed request received: ${speed}x`);
    simManager.setSpeed(speed);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});