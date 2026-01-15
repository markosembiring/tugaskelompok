const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/WishlistController');

router.get('/', WishlistController.getAllWishlist);
router.post('/', WishlistController.createWishlist);
router.put('/:id/vote', WishlistController.voteWishlist);
router.delete('/:id', WishlistController.deleteWishlist);

module.exports = router;
