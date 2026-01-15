const Announcement = require('../models/Announcement');
const User = require('../models/User'); // Import User model to fetch phone numbers
const Subscription = require('../models/Subscription'); // Import Model Subscription
const { Op } = require('sequelize'); // Import Op for filtering queries
const https = require('https');
const webpush = require('web-push'); // Library Web Push

// --- KONFIGURASI WEB PUSH ---
const VAPID_PUBLIC_KEY = 'BIoovBAZ4h6Ow6jvi-sir3yomkMcrPeftPIqI69oZ4M1QNrVUdHj15gyEXEOglq8jZnQs9-v56G4L0U00qRD6Lw';
const VAPID_PRIVATE_KEY = 'PK-Ktut6hZngN9iYciYAWBZUO3S-LUdm0kSpqD6GBpo';

webpush.setVapidDetails(
    'mailto:admin@portalkelas.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// --- KONFIGURASI WHATSAPP (FONNTE) ---
// GANTI 'ISI_TOKEN_FONNTE_DISINI' dengan token dari dashboard Fonnte Anda
const FONNTE_TOKEN = 'edDyD5wDgqJ2hFaq4r9o'; 

// ID GRUP WHATSAPP
const WA_GROUP_ID = '120363338749173743@g.us'; 

// Helper untuk Jeda/Delay (Anti-Spam)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// FUNGSI BROADCAST WEB PUSH
const sendWebPushBroadcast = async (title, message) => {
    try {
        const subscriptions = await Subscription.findAll();
        
        if (subscriptions.length === 0) {
            console.log("[WEB PUSH] Tidak ada device yang subscribe.");
            return;
        }

        console.log(`[WEB PUSH] Mengirim broadcast ke ${subscriptions.length} device...`);

        // Payload Notifikasi yang "Kaya" (Rich Notification)
        const notificationPayload = JSON.stringify({
            title: title || '📢 Pengumuman Kelas',
            body: message || 'Silakan cek portal untuk info lengkap.',
            icon: 'https://cdn-icons-png.flaticon.com/512/10309/10309289.png', // Icon Lonceng 3D
            badge: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png', // Icon kecil (Monochrome)
            url: '/',
            actions: [
                { action: 'open_url', title: '👀 Buka Portal' },
                { action: 'close', title: 'Nanti Saja' }
            ]
        });

        const promises = subscriptions.map(sub => {
            // Validasi keys sebelum parsing
            if (!sub.keys) return Promise.resolve();

            let p256dh, auth;
            try {
                const keys = JSON.parse(sub.keys);
                p256dh = keys.p256dh;
                auth = keys.auth;
            } catch (e) {
                console.error("Error parsing keys for sub:", sub.id);
                return Promise.resolve();
            }

            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: { p256dh, auth }
            };

            return webpush.sendNotification(pushSubscription, notificationPayload)
                .catch(err => {
                    console.error(`[WEB PUSH ERROR] Device ${sub.id}: ${err.statusCode}`);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log(`Deleting invalid subscription: ${sub.id}`);
                        return Subscription.destroy({ where: { id: sub.id } });
                    }
                });
        });

        await Promise.all(promises);
        console.log("[WEB PUSH] Selesai dikirim.");
    } catch (err) {
        console.error("Error in Web Push Broadcast:", err);
    }
};

// FUNGSI BROADCAST WHATSAPP
const sendWhatsAppBroadcast = (targetPhone, messageText) => {
    // Pastikan variable (formattedPhone) tidak dipakai lagi di logic pembersihan lama yang sudah dihapus
    
    let formattedTarget = targetPhone;

    // Logika handling: Jika ini Group ID (ada @g.us), jangan diformat sebagai nomor HP biasa
    if (targetPhone && !targetPhone.includes('@g.us')) {
        formattedTarget = targetPhone.replace(/\D/g, '');
        if (formattedTarget.startsWith('0')) {
            formattedTarget = '62' + formattedTarget.slice(1);
        }
    }
    
    // Log singkat saja biar tidak spam console
    console.log(`[WA BROADCAST] Sending to ${formattedTarget}`);

    const postData = JSON.stringify({
        target: formattedTarget,
        message: messageText,
        countryCode: '62' // optional
    });

    const options = {
        hostname: 'api.fonnte.com',
        path: '/send',
        method: 'POST',
        headers: {
            'Authorization': FONNTE_TOKEN,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData) // Fix: Gunakan Buffer.byteLength untuk karakter khusus/emoji
        }
    };


    const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.on('data', (d) => {
             process.stdout.write(d);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
};

// Mendapatkan semua pengumuman
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.findAll();
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Membuat pengumuman baru
exports.createAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.create(req.body);
        
        // BROADCAST LOGIC (BACKGROUND PROCESS)
        // Kita bungkus dalam async function terpisah agar response API tetap cepat (tidak loading lama)
        (async () => {
            // 1. Ambil semua user yang punya nomor HP
            const users = await User.findAll({
                where: {
                    phone: {
                        [Op.ne]: null,
                        [Op.ne]: '' 
                    }
                }
            });

            console.log(`Memulai proses broadcast aman ke ${users.length} pengguna...`);

            // --- KIRIM WEB PUSH NOTIFICATION (INDEPENDEN) ---
            // Kita taruh di sini supaya jalan meskipun WA Group error/mati
            try {
                console.log("Mencoba mengirim Web Push...");
                await sendWebPushBroadcast(announcement.title, announcement.content);
            } catch (err) {
                console.error("Gagal mengirim Web Push:", err);
            }

            // Variasi Sapaan (Spintax) agar tidak terdeteksi spam
            const greetings = [
                "Halo", "Hi", "Hai", "Assalamualaikum", "Selamat Pagi/Siang/Malam", "Yo", 
                "Punten", "Permisi", "Woi", "Hola", "Excuse me", "Oi" , "Hello"
            ];
            const intros = [
                "Ada info baru nih", "Sekedar mengingatkan", "Cek info terbaru ya", "Pemberitahuan penting", "Jangan lupa dibaca ya",
                "Mohon perhatiannya sebentar", "Breaking news guys", "Info penting datang nih", "Maaf ganggu waktunya", 
                "Update terbaru nih", "Yuk disimak sebentar", "Boleh minta waktunya bentar", "Ada kabar dari pusat nih", 
                "Info dungs", "Jangan di-skip ya", "Baca bentar yuk", "Penting nih guys"
            ];

            // 2. Kirim ke Grup dulu (Prioritas)
            if (WA_GROUP_ID) {
                // Generate Pesan Unik untuk Grup
                const randomGreetingGroup = greetings[Math.floor(Math.random() * greetings.length)];
                const randomIntroGroup = intros[Math.floor(Math.random() * intros.length)];
                
                // Tambahkan "Guys" atau "Semuanya" biar lebih natural di grup
                const groupMessage = `${randomGreetingGroup} Semuanya 👋\n${randomIntroGroup}..\n\n*${announcement.title}*\n\n${announcement.content}\n\n_Portal Kelas_`;

                // --- KIRIM WEB PUSH NOTIFICATION (HAPUS YANG DISINI, PINDAH KE ATAS) ---
                // sendWebPushBroadcast(announcement.title, announcement.content);

                console.log("Mengirim broadcast ke Grup WhatsApp...");
                sendWhatsAppBroadcast(WA_GROUP_ID, groupMessage);
                // Beri jeda 5 detik sebelum mulai japri member
                await delay(5000); 
            }

            // 3. Kirim pesan ke setiap user dengan JEDA/DELAY (Pencegahan Banned)
            for (const user of users) {
                if (user.phone && user.phone.length > 5) {
                    
                    // -- PERSONALISASI PESAN --
                    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                    const randomIntro = intros[Math.floor(Math.random() * intros.length)];
                    // Ambil nama depan saja
                    const firstName = user.name ? user.name.split(' ')[0] : 'Kawan';

                    // Susun pesan unik
                    const personalMessage = `${randomGreeting} ${firstName} 👋\n${randomIntro}..\n\n*${announcement.title}*\n\n${announcement.content}\n\n_Portal Kelas_`;

                    sendWhatsAppBroadcast(user.phone, personalMessage);
                    
                    // Jeda Random antara 4 sampai 8 detik antar pesan
                    // Ini membuat pengiriman terlihat lebih 'manusiawi' dan mengurangi risiko dianggap bot spam
                    const randomDelay = Math.floor(Math.random() * 4000) + 4000; 
                    await delay(randomDelay);
                }
            }
            console.log("Semua broadcast selesai dikirim.");
        })();

        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Menghapus pengumuman berdasarkan ID
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await Announcement.destroy({ where: { id } });
        res.json({ message: 'Pengumuman berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
