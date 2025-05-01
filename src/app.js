const express = require('express');
const app = express();
const authRoutes = require('./routes/Admin/authRoutes'); // Import auth routes
const userRoutes = require('./routes/Admin/userRoutes'); // Import user routes
const eventRoutes = require('./routes/Admin/eventRoutes'); // Import user routes
const connectionRoutes = require('./routes/Admin/connectionRoutes'); // Import user routes
const userAuthRoutes = require('./routes/User/userAuthRoutes');
const bodyParser = require('body-parser');
const cors = require('cors');

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Use Routes
app.use('/api/auth', authRoutes); 
app.use('/api/users', userRoutes); // Include user routes if needed
app.use('/api/events', eventRoutes); // Include event routes if needed
app.use('/api/connections', connectionRoutes);
app.use('/api/user-auth', userAuthRoutes);

// Default Route
app.get('/', (req, res) => {
    res.send('Server is running...');
});

const authenticateToken = require('./middleware/userAuth');
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You accessed protected route', user: req.user });
});

module.exports = app;