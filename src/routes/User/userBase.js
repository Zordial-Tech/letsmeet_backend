const express = require('express');
const router = express.Router();
const authController = require('../../controllers/User/userController');
const userAuth = require('../../middleware/userAuth');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/', userAuth, authController.getUserProfile);
router.get('/roles', authController.getUserRoles);
router.put('/edit', userAuth, authController.editUserProfile);


module.exports = router;
