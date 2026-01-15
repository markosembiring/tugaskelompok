const Schedule = require('../models/Schedule');

// Mendapatkan semua jadwal kuliah
exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.findAll();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Membuat jadwal baru
exports.createSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.create(req.body);
        res.status(201).json(schedule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Memperbarui jadwal yang ada
exports.updateSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByPk(req.params.id);
        if (schedule) {
            await schedule.update(req.body);
            res.json(schedule);
        } else {
            res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Menghapus jadwal
exports.deleteSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findByPk(req.params.id);
        if (schedule) {
            await schedule.destroy();
            res.json({ message: 'Jadwal berhasil dihapus' });
        } else {
            res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
