const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/PermissionController');

router.get('/', permissionController.getAllPermissions);
router.post('/', permissionController.createPermission);
router.put('/:id/status', permissionController.updatePermissionStatus);

module.exports = router;
