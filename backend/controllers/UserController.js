const User = require('../models/User');
const Kas = require('../models/Kas');
const path = require('path');
const fs = require('fs');
const sequelize = require('../config/database');
const { Op, Sequelize } = require('sequelize');

// Mendapatkan semua data pengguna
exports.getAllUsers = async (req, res) => {
    try {
        // Exclude 'photo' content to make the response light.
        // We include a tiny flag 'hasPhoto' so frontend knows if it should try fetching the image.
        const users = await User.findAll({
            attributes: { 
                exclude: ['photo'], // CRITICAL: Don't send the massive base64 string
                include: [
                    [
                        Sequelize.literal("CASE WHEN photo IS NOT NULL AND photo != '' THEN 1 ELSE 0 END"),
                        'hasPhoto'
                    ]
                ]
            },
            order: [
                ['name', 'ASC']
            ]
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Get user photo specifically (Lazy Loading) - NO MULTER (Base64 Database Storage)
exports.getUserPhoto = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['photo'] });
        
        if (!user || !user.photo) {
            return res.status(404).send('No photo');
        }

        // Handle Base64 Data URI from DB
        if (user.photo.startsWith('data:image')) {
            const matches = user.photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const type = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                res.set('Content-Type', type);
                return res.send(buffer);
            }
        }

        // Fallback for any raw URL or File (unlikely with this revert, but safer to keep default)
        return res.status(400).send('Invalid photo format in database');

    } catch (error) {
        res.status(500).send(error.message);
    }
};

// Mendapatkan user yang ulang tahun bulan ini
exports.getBirthdays = async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // JS months are 0-indexed

        const users = await User.findAll({
            where: sequelize.where(sequelize.fn('MONTH', sequelize.col('birthDate')), currentMonth),
            attributes: ['id', 'name', 'photo', 'birthDate'],
            order: [[sequelize.fn('DAY', sequelize.col('birthDate')), 'ASC']]
        });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Membuat pengguna baru
exports.createUser = async (req, res) => {
    try {
        // Fix: Bersihkan data kosong menjadi null agar tidak ditolak database
        if (req.body.birthDate === '') req.body.birthDate = null;
        if (req.body.phone === '') req.body.phone = null;

        // Reverted to simple body parsing (Base64 in req.body.photo)
        const user = await User.create(req.body);
        await Kas.create({ userId: user.id });
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Mendapatkan pengguna berdasarkan ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { 
                exclude: ['photo'],
                include: [
                     [Sequelize.literal('CASE WHEN photo IS NOT NULL AND photo != "" THEN true ELSE false END'), 'hasPhoto']
                ]
            }
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Memperbarui data pengguna
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            // Handle empty date string for 'birthDate' to match DATE type or allow NULL
            if (req.body.birthDate === '') {
                req.body.birthDate = null;
            }

            // Validasi sederhana untuk phone (opsional)
            // if (req.body.phone === '') req.body.phone = null;

            // Update user
            await user.update(req.body);
            res.json(user);
        } else {
            res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
    } catch (error) {
        console.error("Update Error:", error); // Debugging
        res.status(400).json({ message: error.message });
    }
};

// Menghapus pengguna
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            // No file cleanup needed as we store Base64 in DB
            await user.destroy();
            res.json({ message: 'Pengguna berhasil dihapus' });
        } else {
            res.status(404).json({ message: 'Pengguna tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Proses Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Mencari user yang cocok dengan username dan password
        // Catatan: Password sebaiknya di-hash di production (misal: bcrypt)
        const user = await User.findOne({ 
            where: { username, password },
            attributes: { 
                exclude: ['photo'],
                include: [
                     [Sequelize.literal('CASE WHEN photo IS NOT NULL AND photo != "" THEN true ELSE false END'), 'hasPhoto']
                ] 
            }
        });
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ message: 'Username atau password salah' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
