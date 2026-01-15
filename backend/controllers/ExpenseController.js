const Expense = require('../models/Expense');

// Mendapatkan semua data pengeluaran, diurutkan dari tanggal terbaru
exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({ order: [['date', 'DESC']] });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mencatat pengeluaran baru
exports.createExpense = async (req, res) => {
    try {
        const expense = await Expense.create(req.body);
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Menghapus data pengeluaran
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (expense) {
            await expense.destroy();
            res.json({ message: 'Data pengeluaran berhasil dihapus' });
        } else {
            res.status(404).json({ message: 'Data pengeluaran tidak ditemukan' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
