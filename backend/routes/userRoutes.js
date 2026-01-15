const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// Removed Multer configuration as requested.
// We are reverting to processing Base64 strings from standard JSON bodies,
// but we will still support the optimized "Lazy Loading" via specific routes.

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser); // Using JSON body
router.get('/:id', userController.getUserById);
router.get('/birthdays/monthly', userController.getBirthdays);
router.get('/:id/photo', userController.getUserPhoto); // Optimized Lazy Load Endpoint
router.put('/:id', userController.updateUser); // Using JSON body
router.delete('/:id', userController.deleteUser);
router.post('/login', userController.login);

module.exports = router;
