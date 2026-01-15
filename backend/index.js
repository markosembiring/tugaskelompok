const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const path = require('path');

// Memuat variabel lingkungan dari file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Konfigurasi CORS (Cross-Origin Resource Sharing)
// Mengizinkan akses dari semua origin untuk development
app.use(cors({
    origin: true, // Allow all origins (for dev)
    credentials: true
}));

// Middleware untuk parsing body request
// Limit ditingkatkan ke 50mb untuk menangani upload gambar base64 yang besar
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Menyajikan file statis (gambar yang diupload)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Import Routes (Rute API) ---
const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const kasRoutes = require('./routes/kasRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // Tambahan: Route Notifikasi
const wishlistRoutes = require('./routes/wishlistRoutes');

// --- Menggunakan Routes ---
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes); 
app.use('/api/schedules', scheduleRoutes);
app.use('/api/kas', kasRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/wishlists', wishlistRoutes);

// Mengembalikan konfigurasi kecil yang dibutuhkan klien (tanpa mengekspos rahasia lain)
app.get('/client-config', cors(), (req, res) => {
    console.log('/client-config requested from', req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    res.json({
        apiKey: process.env.GEMINI_API_KEY || '',
        apiUrl: process.env.CLIENT_API_URL || '/api'
    });
});

// Menyajikan file statis dari direktori parent (Frontend)
// Ini memungkinkan backend untuk melayani file frontend (index.html, script.js, styles.css)
app.use(express.static(path.join(__dirname, '../')));

// Catch-all route: Mengembalikan index.html untuk setiap request yang tidak cocok dengan API
// Ini penting untuk Single Page Application (SPA) routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Sinkronisasi Database dan Menjalankan Server
// { alter: true } akan menyesuaikan tabel jika ada perubahan model tanpa menghapus data
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database berhasil disinkronisasi');
        app.listen(PORT, () => {
            console.log(`Server berjalan di port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Gagal menyinkronkan database:', err);
    });
