const Kas = require('../models/Kas');
const User = require('../models/User');

// Fungsi helper untuk membuat struktur data kas default (2024-2028)
const getDefaultKasData = () => {
    const data = {};
    for (let year = 2024; year <= 2028; year++) {
        data[year] = Array(12).fill(false); // False berarti belum bayar
    }
    return data;
};

// Mendapatkan semua data Kas
// Menggabungkan data User dan Kas secara manual untuk menghindari duplikasi
exports.getAllKas = async (req, res) => {
    // console.log("Fetching Kas (Manual Join & Dedupe)..."); // Debug log dihapus untuk kebersihan
    try {
        // 1. Ambil semua data user (hanya id dan nama)
        const users = await User.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });

        // 2. Ambil semua record Kas
        const allKas = await Kas.findAll();
        const kasMap = {};
        // Buat map userId -> months untuk akses cepat
        allKas.forEach(k => {
            kasMap[k.userId] = k.months;
        });

        // 3. Deduplikasi berdasarkan Nama (Pencegahan jika ada data kotor di DB)
        const seenNames = new Set();
        const uniqueUsers = [];
        
        for (const user of users) {
            if (!seenNames.has(user.name)) {
                seenNames.add(user.name);
                uniqueUsers.push(user);
            }
        }

        // 4. Format data akhir untuk dikirim ke frontend
        const formattedKas = uniqueUsers.map(user => ({
            id: user.id,
            name: user.name,
            months: kasMap[user.id] || getDefaultKasData() // Gunakan default jika belum ada record kas
        }));
        
        res.json(formattedKas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Memperbarui data Kas
exports.updateKas = async (req, res) => {
    try {
        // Mencari record Kas berdasarkan userId (req.params.id)
        let kas = await Kas.findOne({ where: { userId: req.params.id } });
        
        if (!kas) {
            // Jika belum ada, buat baru (untuk user baru)
            kas = await Kas.create({
                userId: req.params.id,
                months: getDefaultKasData()
            });
        }

        if (kas) {
            // Update data bulan
            await kas.update(req.body);
            res.json(kas);
        } else {
            res.status(404).json({ message: 'Data Kas tidak ditemukan' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
