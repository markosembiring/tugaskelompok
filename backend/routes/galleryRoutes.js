const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/GalleryController');

router.get('/', galleryController.getAllGallery);
router.post('/', galleryController.createGallery);
router.delete('/:id', galleryController.deleteGallery);

module.exports = router;
