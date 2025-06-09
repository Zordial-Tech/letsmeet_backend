require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/config/logger');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); //http requests


const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup socket handling
const setupSocket = require('./src/socket');
setupSocket(io, logger);


// Middleware for parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security middleware
app.use(helmet());

// CORS Configuration - Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', routes);
app.use(errorHandler);

// Server Initialization
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
server.listen(PORT, HOST, () => {
  logger.info(`Server running with Socket.IO on port ${PORT} and host ${HOST}`);
});

// Handle Unexpected Errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
