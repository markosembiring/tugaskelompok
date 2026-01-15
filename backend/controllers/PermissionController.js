const Permission = require('../models/Permission');

// Mendapatkan semua data perizinan, diurutkan dari yang terbaru
exports.getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({ order: [['createdAt', 'DESC']] });
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Membuat pengajuan izin baru
exports.createPermission = async (req, res) => {
    try {
        const permission = await Permission.create(req.body);
        res.status(201).json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Memperbarui status izin (misal: dari pending ke approved/rejected)
exports.updatePermissionStatus = async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.id);
        if (permission) {
            await permission.update({ status: req.body.status });
            res.json(permission);
        } else {
            res.status(404).json({ message: 'Data perizinan tidak ditemukan' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
