const Complaint = require('../models/Complaint');

// Mendapatkan semua keluhan
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll();
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Membuat keluhan baru
exports.createComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.create(req.body);
        res.status(201).json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
