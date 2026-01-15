const Wishlist = require('../models/Wishlist');

exports.getAllWishlist = async (req, res) => {
    try {
        const items = await Wishlist.findAll({ order: [['votes', 'DESC']] });
        res.json(items);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createWishlist = async (req, res) => {
    try {
        await Wishlist.create(req.body);
        res.status(201).json({ msg: "Usulan disimpan" });
    } catch (e) { res.status(400).json({ error: e.message }); }
};

exports.voteWishlist = async (req, res) => {
    try {
        const item = await Wishlist.findByPk(req.params.id);
        item.votes += 1;
        await item.save();
        res.json(item);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteWishlist = async (req, res) => {
    try {
        await Wishlist.destroy({ where: { id: req.params.id } });
        res.json({ msg: "Dihapus" });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
