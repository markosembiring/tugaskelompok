const Gallery = require('../models/Gallery');

// Mendapatkan semua item galeri, diurutkan dari yang terbaru
exports.getAllGallery = async (req, res) => {
    try {
        const gallery = await Gallery.findAll({ order: [['createdAt', 'DESC']] });
        res.json(gallery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Menambahkan item baru ke galeri
exports.createGallery = async (req, res) => {
    try {
        const gallery = await Gallery.create(req.body);
        res.status(201).json(gallery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Menghapus item galeri berdasarkan ID
exports.deleteGallery = async (req, res) => {
    try {
        const gallery = await Gallery.findByPk(req.params.id);
        if (gallery) {
            await gallery.destroy();
            res.json({ message: 'Item galeri berhasil dihapus' });
        } else {
            res.status(404).json({ message: 'Item galeri tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
