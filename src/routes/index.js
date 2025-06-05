const express = require('express');
const authRoutes = require('./Admin/authRoutes');
const userRoutes = require('./Admin/userRoutes');
const eventRoutes = require('./Admin/eventRoutes');
const connectionRoutes = require('./Admin/connectionRoutes');
const settingRoutes = require('./Admin/settingRoutes');
const adminRoutes = require('./Admin/adminRoutes');
const reportRoutes = require('./Admin/reportRoutes');

//User
const userBase = require('./User/userBase');
const userEvents = require('./User/userEvents');
const userConnections = require('./User/userConnections');
const userChat = require('./User/usersChat');


const router = express.Router();

router.use('/admin-auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/connections', connectionRoutes);
router.use('/settings', settingRoutes);
router.use('/admin', adminRoutes);
router.use('/security', reportRoutes);

//User
router.use('/user-profile', userBase);
router.use('/user-events', userEvents);
router.use('/user-connections', userConnections);
router.use('/user-Chat', userChat);

module.exports = router;
