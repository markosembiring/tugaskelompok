const express = require('express');
const router = express.Router();
const kasController = require('../controllers/KasController');

router.get('/', kasController.getAllKas);
router.put('/:id', kasController.updateKas);

module.exports = router;
