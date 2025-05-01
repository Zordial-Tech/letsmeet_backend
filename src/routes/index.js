const express = require('express');
const authRoutes = require('./Admin/authRoutes');
const userRoutes = require('./Admin/userRoutes');
const eventRoutes = require('./Admin/eventRoutes');
const connectionRoutes = require('./Admin/connectionRoutes');
const settingRoutes = require('./Admin/settingRoutes');
const adminRoutes = require('./Admin/adminRoutes');
// const reportRoutes = require('./reportRoutes');

//User
const userAuthRoutes = require('./User/userAuthRoutes');


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/connections', connectionRoutes);
router.use('/settings', settingRoutes);
router.use('/admin', adminRoutes);
// router.use('/reports', reportRoutes);

//User
router.use('/user-auth', userAuthRoutes);
router.use('/user', userAuthRoutes);

module.exports = router;
