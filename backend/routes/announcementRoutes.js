const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/AnnouncementController');

router.get('/', announcementController.getAllAnnouncements);
router.post('/', announcementController.createAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
