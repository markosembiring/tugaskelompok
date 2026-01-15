let apiKey = '';
let API_URL = '';

// --- GEMINI API HELPER ---
async function callGemini(prompt, imageBase64 = null) {
    // Menggunakan Gemini 1.5 Pro
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let parts = [{ text: prompt }];

    if (imageBase64) {
        // Deteksi MimeType otomatis dari string base64 (misal: data:image/jpeg;base64,...)
        // Jika tidak ada header, default ke png
        const mimeType = imageBase64.match(/data:([^;]+);/) ? imageBase64.match(/data:([^;]+);/)[1] : "image/png";
        const base64Data = imageBase64.split(',')[1];

        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }

    const payload = { contents: [{ parts: parts }] };

    // Retry logic: Maksimal 3 kali percobaan
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text(); // Baca pesan error dari Google jika ada
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            // Cek apakah ada candidate (kadang kosong jika kena filter safety)
            if (!data.candidates || data.candidates.length === 0) {
                return "Maaf, AI tidak dapat merespons (Mungkin terhalang filter keamanan).";
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.warn(`Percobaan ke-${i + 1} gagal:`, error.message);

            // Jika sudah percobaan terakhir, lempar error keluar
            if (i === maxRetries - 1) throw error;

            // Tunggu sebentar sebelum mencoba lagi (Exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
}
// --- DATA MOCKUP (TIDAK DIGUNAKAN) ---
// Data ini disimpan sebagai referensi struktur objek, namun aplikasi kini menggunakan API.
/*
const db = {
    users: [
        { id: 1, name: "Super Admin", username: "admin", password: "123", role: "superadmin", nim: "001", position: "Komting", bio: "Menjaga ketertiban kelas adalah jalan ninjaku.", photo: null },
        { id: 2, name: "Budi Santoso", role: "member", username: "budi", password:"123", nim: "12346", position: "Bendahara", bio: "Bayarlah kas sebelum ditagih.", photo: null },
        { id: 3, name: "Siti Aminah", username: "siti", password:"123", role: "member", nim: "12347", position: "Sekretaris", bio: "Mencatat segalanya.", photo: null },
        { id: 4, name: "Mahasiswa Biasa", username: "mhs", password: "123", role: "member", nim: "12345", position: "Anggota", bio: "Bismillah cumlaude.", photo: null },
        { id: 5, name: "Joko Anwar", username: "joko", password: "123", role: "member", nim: "12348", position: "Anggota", bio: "Kuliah pulang kuliah pulang.", photo: null }
    ],
    schedules: [
        { id: 1, day: "Senin", subject: "Pemrograman Web", time: "17:00 - 19:30", room: "Lab 2", picket: "Budi, Andi" },
        { id: 2, day: "Selasa", subject: "Basis Data", time: "19:00 - 21:00", room: "R.Teori 1", picket: "Siti, Admin" },
    ],
    kas: [
        { id: 1, name: "Super Admin", months: [true, true, true, true] },
        { id: 2, name: "Budi Santoso", months: [true, true, false, false] },
        { id: 3, name: "Siti Aminah", months: [true, true, true, true] },
        { id: 4, name: "Mahasiswa Biasa", months: [false, false, false, false] },
        { id: 5, name: "Joko Anwar", months: [true, false, false, false] },
    ],
    announcements: [
        { id: 1, title: "Pembayaran Uang Kas", content: "Harap segera melunasi kas bulan November.", date: "2023-11-20", color: "primary" },
        { id: 2, title: "Perubahan Jadwal UTS", content: "UTS Basis Data dimajukan menjadi hari Rabu depan.", date: "2023-11-22", color: "warning" }
    ],
    keluhan: [
        { id: 1, text: "AC di Lab 2 panas sekali mohon lapor prodi.", isAnon: true, replies: [] },
        { id: 2, text: "Kursi saya rusak sandarannya.", isAnon: false, sender: "Budi", replies: [{sender:"Admin", text:"Oke, sudah dicatat."}] }
    ],
    gallery: [
        { id: 1, url: "data:image/jpeg;base64,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", desc: "Bang Marko 2025", uploader: "Admin", date: "20 Nov 2025" },
        { id: 2, url: "data:image/jpeg;base64,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", desc: "Soeharto Ganas", uploader: "Siti", date: "17 Agustus 1945" }
    ],
    permissions: [
        { id: 1, user: "Budi Santoso", type: "Sakit", reason: "Demam Tinggi", status: "pending", date: "2023-11-23", proof: "surat_dokter.pdf" },
        { id: 2, user: "Siti Aminah", type: "Izin", reason: "Acara Keluarga", status: "approved", date: "2023-11-20", proof: "undangan.jpg" }
    ]
};
*/

const POSITION_PRIORITY = {
    "Komting": 1, "Wakil Komting": 2, "Sekretaris": 3, "Bendahara": 4, "Anggota Inti": 5, "Anggota": 99
};

const app = {
    currentUser: null,
    memberSearchTerm: "",
    chatHistory: [],

    init: async function () {
        document.getElementById('login-form').addEventListener('submit', (e) => { e.preventDefault(); this.login(); });
        document.getElementById('toggle-sidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('close-sidebar').addEventListener('click', () => this.toggleSidebar());
        if (window.innerWidth < 992) this.setSidebarState(true);

        // Auto Dark Mode
        const h = new Date().getHours();
        if (h >= 18 || h < 6) this.toggleTheme('dark');

        // Load client-side config (apiKey, API_URL) from backend for safety
        try {
            const res = await fetch('/client-config');
            if (res.ok) {
                const cfg = await res.json();
                apiKey = cfg.apiKey || '';
                API_URL = cfg.apiUrl || '';
            } else {
                console.warn('Gagal memuat konfigurasi klien:', res.status);
            }
        } catch (e) {
            console.warn('Error fetching client config:', e);
        }

        // Check for saved session
        const savedUser = localStorage.getItem('user_session');
        if (savedUser) {
            try {
                this.setSession(JSON.parse(savedUser), false); // Don't route yet

                // Handle initial URL
                const path = window.location.pathname.substring(1); // Remove leading slash
                if (path && path !== 'index.html') {
                    this.router(path, false); // Don't push state for initial load
                } else {
                    this.router('dashboard', false);
                }
            } catch (e) {
                console.error("Invalid session", e);
                localStorage.removeItem('user_session');
                this.loginAsGuest();
            }
        } else {
            this.loginAsGuest();
        }

        // Handle browser back/forward
        window.onpopstate = (event) => {
            if (event.state && event.state.page) {
                this.router(event.state.page, false);
            } else if (this.currentUser) {
                this.router('dashboard', false);
            }
        };

        // Check System Theme Preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.toggleTheme(true);
            document.getElementById('theme-toggle-checkbox').checked = true;
        }
    },

    // --- THEME ---
    toggleTheme: function (forceDark = null) {
        const body = document.body;
        const checkbox = document.getElementById('theme-toggle-checkbox');

        let isDark = body.getAttribute('data-theme') === 'dark';

        // If forceDark is provided, use it (boolean)
        // Else, toggle based on checkbox state (or toggle current state)
        if (forceDark !== null) {
            isDark = !forceDark; // Logic below flips it, so start opposite
        } else if (checkbox) {
            isDark = !checkbox.checked; // Checkbox is already changed when this runs via onchange, so we want to sync to it? No, onchange happens after.
            // Actually easier: set theme based on checkbox.checked
            isDark = !checkbox.checked;
        }

        // Apply the NEW state
        if (isDark) {
            body.removeAttribute('data-theme'); // Go Light
        } else {
            body.setAttribute('data-theme', 'dark'); // Go Dark
        }
    },

    // --- HELPER: Image Compression to WebP ---
    compressImage: function (file, quality = 0.7, maxWidth = 500) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/webp', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    },

    // --- AI FEATURES ---
    toggleChat: function () {
        const chatWin = document.getElementById('chat-window');
        chatWin.style.display = chatWin.style.display === 'flex' ? 'none' : 'flex';
        if (chatWin.style.display === 'flex') document.getElementById('chat-input').focus();
    },

    sendMessage: async function () {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg) return;

        const chatBody = document.getElementById('chat-messages');
        chatBody.innerHTML += `<div class="chat-bubble user">${msg}</div>`;
        input.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        const loaderId = 'typing-' + Date.now();
        chatBody.innerHTML += `<div class="chat-bubble ai" id="${loaderId}"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            let schedules = [];
            try {
                const res = await fetch(`${API_URL}/schedules`);
                if (res.ok) schedules = await res.json();
            } catch (err) { console.error("AI Context Error:", err); }

            const systemPrompt = `Kamu adalah Komting AI, asisten virtual kelas IF B Sore. Jawablah dengan santai tapi sopan. Bantu user seputar jadwal kuliah, tugas, atau tips programming. Jadwal: ${JSON.stringify(schedules)}.`;
            const fullPrompt = `${systemPrompt}\n\nUser: ${msg}`;
            const response = await callGemini(fullPrompt);

            document.getElementById(loaderId).remove();
            chatBody.innerHTML += `<div class="chat-bubble ai">${marked.parse(response)}</div>`;
        } catch (e) {
            document.getElementById(loaderId).remove();
            chatBody.innerHTML += `<div class="chat-bubble ai text-danger">Maaf, koneksi otak saya sedang terganggu. Coba lagi ya!</div>`;
        }
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    generateCaption: async function (base64Img) {
        const btn = document.getElementById('btn-gen-caption');
        const output = document.getElementById('uDesc');
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Mikir...`;
        btn.disabled = true;
        try {
            const prompt = "Buat caption singkat, lucu, dan relevan untuk foto kegiatan mahasiswa IT ini dalam Bahasa Indonesia. Jangan terlalu kaku.";
            const result = await callGemini(prompt, base64Img);
            output.value = result.replace(/^["']|["']$/g, '');
        } catch (e) {
            app.showToast("Gagal generate caption: " + e.message, 'danger');
        } finally {
            btn.innerHTML = `✨ Buat Caption Otomatis`;
            btn.disabled = false;
        }
    },

    refinePermission: async function () {
        const reasonInput = document.getElementById('reqReason');
        const reason = reasonInput.value;
        if (!reason) return app.showToast("Isi alasan singkat dulu, nanti saya perbagus!", 'warning');
        const btn = document.getElementById('btn-refine-perm');
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Memoles...`;
        btn.disabled = true;
        try {
            const prompt = `Ubah alasan izin tidak masuk kuliah ini menjadi kalimat formal yang sopan dan profesional untuk dosen: "${reason}"`;
            const result = await callGemini(prompt);
            reasonInput.value = result.replace(/^["']|["']$/g, '');
        } catch (e) {
            app.showToast("Gagal memoles kata: " + e.message, 'danger');
        } finally {
            btn.innerHTML = `✨ Formalin Bahasa`;
            btn.disabled = false;
        }
    },

    // --- NAVIGATION & AUTH ---
    toggleSidebar: function () {
        const sb = document.getElementById('sidebar'), ct = document.getElementById('main-content'), bd = document.getElementById('mobile-backdrop');
        sb.classList.toggle('collapsed'); ct.classList.toggle('expanded');
        if (window.innerWidth < 992) bd.classList.toggle('show', !sb.classList.contains('collapsed'));
    },

    setSidebarState: function (isCollapsed) {
        const sb = document.getElementById('sidebar'), ct = document.getElementById('main-content'), bd = document.getElementById('mobile-backdrop');
        if (isCollapsed) { sb.classList.add('collapsed'); ct.classList.add('expanded'); bd.classList.remove('show'); }
        else { sb.classList.remove('collapsed'); ct.classList.remove('expanded'); }
    },

    login: async function () {
        const u = document.getElementById('username').value.trim();
        const p = document.getElementById('password').value.trim();
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            if (response.ok) {
                const user = await response.json();
                this.setSession(user);
                document.getElementById('login-error').classList.add('d-none');
            } else {
                document.getElementById('login-error').classList.remove('d-none');
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('login-error').classList.remove('d-none');
        }
    },

    loginAsGuest: function () { this.setSession({ name: "Tamu", role: "viewer", nim: "-" }); },

    setSession: function (user, routeToDashboard = true) {
        this.currentUser = user;
        localStorage.setItem('user_session', JSON.stringify(user)); // Save session
        document.getElementById('login-page').classList.add('d-none');
        document.getElementById('app-layout').classList.remove('d-none');
        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('header-user-name').innerText = user.name;
        document.getElementById('header-user-role').innerText = user.role.toUpperCase();
        document.getElementById('user-role-badge-sidebar').innerText = user.role.toUpperCase();
        this.updateProfileDropdown();
        this.renderSidebar();
        if (routeToDashboard) this.router('dashboard');
    },

    updateProfileDropdown: function () {
        // Targets: Header Dropdown Logout & Sidebar Dropdown Logout
        const headerLogoutBtn = document.querySelector('.app-header .dropdown-menu a[onclick*="app.logout"]');
        const sidebarLogoutBtn = document.querySelector('#sidebar .dropdown-menu button[onclick*="app.logout"]');

        const isGuest = this.currentUser && this.currentUser.role === 'viewer';

        if (headerLogoutBtn) {
            headerLogoutBtn.innerHTML = isGuest ? '<i class="bi bi-box-arrow-in-right"></i> Login' : '<i class="bi bi-box-arrow-right"></i> Keluar';
            headerLogoutBtn.className = isGuest ?
                headerLogoutBtn.className.replace('text-danger', 'text-primary') :
                headerLogoutBtn.className.replace('text-primary', 'text-danger');
        }

        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.innerHTML = isGuest ? 'Login' : 'Sign out';
            sidebarLogoutBtn.className = isGuest ? 'dropdown-item text-primary fw-bold' : 'dropdown-item';
        }

        // Hide Profile/Settings for Guest in Header
        const profileLinks = document.querySelectorAll('.app-header .dropdown-menu li:not(:last-child)');
        profileLinks.forEach(li => {
            if (li.querySelector('hr') || li.querySelector('.dropdown-header')) return; // Keep dividers/headers? Maybe hide them too.
            // Actually, let's just toggle visibility of the non-logout items
            li.style.display = isGuest ? 'none' : 'block';
        });

        // Hide dividers as well if guest
        const dividers = document.querySelectorAll('.app-header .dropdown-menu hr');
        dividers.forEach(hr => hr.parentElement.style.display = isGuest ? 'none' : 'block');
        const headers = document.querySelectorAll('.app-header .dropdown-menu .dropdown-header');
        headers.forEach(h => h.parentElement.style.display = isGuest ? 'none' : 'block');
    },

    logout: function () {
        this.currentUser = null;
        localStorage.removeItem('user_session'); // Clear session
        document.getElementById('app-layout').classList.add('d-none');
        document.getElementById('login-page').classList.remove('d-none');
        document.getElementById('username').value = ''; document.getElementById('password').value = '';
        history.pushState(null, '', '/'); // Reset URL
        if (window.innerWidth < 992) this.setSidebarState(true);
    },

    router: function (page, pushState = true) {
        // Update URL
        if (pushState) {
            history.pushState({ page: page }, '', `/${page}`);
        }

        const container = document.getElementById('page-container');
        let title = page.charAt(0).toUpperCase() + page.slice(1);
        if (page === 'Izin-sakit') title = 'Izin/Sakit';
        document.getElementById('page-title').innerText = title;

        // Update Breadcrumb
        const breadcrumb = document.getElementById('page-breadcrumb');
        if (breadcrumb) breadcrumb.innerText = title;

        if (window.innerWidth < 992) this.setSidebarState(true);
        if (page !== 'anggota') this.memberSearchTerm = "";

        if (page === 'admin' && this.currentUser.role !== 'superadmin') {
            container.innerHTML = `<div class="alert alert-danger shadow-sm border-0 rounded-3">⛔ Akses Ditolak! Halaman ini hanya untuk Super Admin.</div>`; return;
        }

        container.innerHTML = `<div class="d-flex justify-content-center pt-5"><div class="spinner-border text-primary" role="status"></div></div>`;

        setTimeout(() => {
            container.classList.remove('fade-in'); void container.offsetWidth; container.classList.add('fade-in');
            switch (page) {
                case 'dashboard': this.renderDashboard(container); break;
                case 'jadwal': this.renderSchedule(container); break;
                case 'kas': this.renderKas(container); break;
                case 'gallery': this.renderGallery(container); break;
                case 'anggota': this.renderMembers(container); break;
                case 'keluhan': this.renderComplaints(container); break;
                case 'Izin-sakit': this.renderRequests(container); break;
                case 'admin': this.renderAdmin(container); break;
                case 'about': this.renderAbout(container); break;
                default: this.render404(container); break;
            }
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const link = document.getElementById(`nav-${page}`); if (link) link.classList.add('active');
        }, 150);
    },

    // --- RENDERERS ---
    renderDashboard: async function (c) {
        if (this.quoteInterval) clearInterval(this.quoteInterval);

        let quotes = [];
        try {
            // Menggunakan Quotable API
            const res = await fetch('https://api.quotable.io/quotes/random?limit=50');
            if (!res.ok) throw new Error('Quotable failed');
            const data = await res.json();
            quotes = data.map(item => ({ q: item.content, a: item.author }));
        } catch (e) {
            console.error("Gagal mengambil quotes dari Quotable:", e);
            // Fallback quotes jika API gagal total (agar tetap ada animasi)
            quotes = [
                { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
                { q: "It is not a bug, it is an undocumented feature.", a: "Anonymous" },
                { q: "Code is like humor. When you have to explain it, it’s bad.", a: "Cory House" },
                { q: "Simplicity is the soul of efficiency.", a: "Austin Freeman" },
                { q: "Before software can be reusable it first has to be usable.", a: "Ralph Johnson" }
            ];
        }

        if (!quotes || quotes.length === 0) {
            quotes = [{ q: "Semangat coding! Jangan lupa istirahat.", a: "System" }];
        }

        let quoteIndex = 0;
        const currentQuote = quotes[0];

        const announcementsRes = await fetch(`${API_URL}/announcements`);
        const announcements = await announcementsRes.json();

        // Fetch Kas Data for Statistics
        const kasRes = await fetch(`${API_URL}/kas`);
        const kasData = await kasRes.json();
        const totalUsers = kasData.length;

        // Fetch Permissions for Attendance
        const permissionsRes = await fetch(`${API_URL}/permissions`);
        const permissions = await permissionsRes.json();

        // Fetch Schedules for Today
        const schedulesRes = await fetch(`${API_URL}/schedules`);
        const schedules = await schedulesRes.json();
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const today = days[new Date().getDay()];
        const todaySchedules = schedules.filter(s => s.day === today);

        // Fetch Homework (Top 3 Nearest)
        let upcomingHomework = [];
        try {
            const hwRes = await fetch(`${API_URL}/homework`);
            const allHw = await hwRes.json();
            upcomingHomework = allHw.slice(0, 3);

            // Update notification badge
            const badge = document.getElementById('homework-badge');
            if (badge) {
                if (allHw.length > 0) {
                    badge.innerText = allHw.length;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (e) { console.error("Error fetching homework", e); }

        // Fetch Birthdays
        let birthdayUsers = [];
        try {
            const bRes = await fetch(`${API_URL}/users/birthdays/monthly`);
            if (bRes.ok) birthdayUsers = await bRes.json();
        } catch (e) { console.error("Error fetching birthdays", e); }

        // Calculate Attendance for Current Week (Mon-Fri)
        const getMonday = (d) => {
            d = new Date(d);
            const day = d.getDay(),
                diff = d.getDate() - day + (day == 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        }
        const mondayDate = getMonday(new Date());
        const attendanceData = [];

        for (let i = 0; i < 5; i++) {
            const d = new Date(mondayDate);
            d.setDate(mondayDate.getDate() + i);
            const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD

            // Count absent (permissions that are NOT rejected)
            const absentCount = permissions.filter(p => p.date === dateString && p.status !== 'rejected').length;
            attendanceData.push(Math.max(0, totalUsers - absentCount));
        }

        // Process Kas Data
        const years = [2024, 2025, 2026, 2027, 2028];
        const kasStats = {};

        years.forEach(year => {
            kasStats[year] = Array(12).fill(0);
        });

        kasData.forEach(user => {
            years.forEach(year => {
                if (user.months && user.months[year]) {
                    user.months[year].forEach((hasPaid, monthIndex) => {
                        if (hasPaid) kasStats[year][monthIndex]++;
                    });
                }
            });
        });

        // Determine Kas Status
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        let kasStatus = {
            status: 'Aman',
            message: 'Lunas bulan ini',
            theme: 'success',
            icon: 'bi-check-circle-fill'
        };

        if (this.currentUser.role === 'admin' || this.currentUser.role === 'superadmin') {
            const unpaidUsers = kasData.filter(u => {
                if (!u.months || !u.months[currentYear]) return true;
                return !u.months[currentYear][currentMonth];
            });

            if (unpaidUsers.length > 0) {
                kasStatus = {
                    status: `${unpaidUsers.length} Belum Bayar`,
                    message: 'Cek detail kas',
                    theme: 'danger',
                    icon: 'bi-exclamation-circle-fill'
                };
            }
        } else {
            const myKas = kasData.find(u => u.name === this.currentUser.name);
            if (myKas) {
                if (!myKas.months || !myKas.months[currentYear] || !myKas.months[currentYear][currentMonth]) {
                    kasStatus = {
                        status: 'Belum Bayar',
                        message: 'Segera lunasi kas!',
                        theme: 'danger',
                        icon: 'bi-exclamation-triangle-fill'
                    };
                }
            } else {
                kasStatus = {
                    status: 'Data Tidak Ada',
                    message: 'Hubungi bendahara',
                    theme: 'warning',
                    icon: 'bi-question-circle-fill'
                };
            }
        }

        c.innerHTML = `
                    <div class="bento-grid">
                        <div class="bento-card bento-col-2 bg-primary text-white border-0 position-relative overflow-hidden">
                            <div class="position-relative z-1">
                                <h2 class="fw-bold">Halo, ${this.currentUser.name}! 👋</h2>
                                <p id="dashboard-quote" class="mb-4 quote-transition" style="max-width: 80%">"${currentQuote.q}" - ${currentQuote.a}</p>
                            </div>
                            <i class="bi bi-code-slash position-absolute end-0 bottom-0 text-white opacity-25" style="font-size: 10rem; transform: translate(20%, 20%);"></i>
                        </div>
                        <div class="bento-card bento-col-2 bento-row-1 card-hover">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-${kasStatus.theme}-subtle p-2 rounded-3 text-${kasStatus.theme} me-3"><i class="bi bi-cash-coin fs-4"></i></div>
                                <h6 class="mb-0 text-muted">Status Kas</h6>
                            </div>
                            <h3 class="fw-bold mb-0 text-${kasStatus.theme}">${kasStatus.status}</h3>
                            <small class="text-${kasStatus.theme}"><i class="bi ${kasStatus.icon}"></i> ${kasStatus.message}</small>
                        </div>
                        <div class="bento-card bento-col-2 bento-row-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="fw-bold mb-0">Statistik Kehadiran</h6>
                                <span class="badge bg-light text-dark border">Minggu Ini</span>
                            </div>
                            <div class="flex-grow-1 position-relative">
                                <canvas id="attendanceChart"></canvas>
                            </div>
                        </div>

                        <!-- BIRTHDAY WIDGET (New) -->
                        <div class="bento-card bento-col-2 bento-row-1">
                            <div class="d-flex align-items-center mb-2">
                                <div class="bg-warning-subtle p-2 rounded-3 text-warning me-3"><i class="bi bi-cake2-fill fs-4"></i></div>
                                <h6 class="mb-0 text-muted">Ulang Tahun Bulan Ini</h6>
                            </div>
                            <div class="d-flex align-items-center gap-2 overflow-auto py-2 custom-scrollbar">
                                ${birthdayUsers.length > 0 ? birthdayUsers.map(u => `
                                    <div class="text-center" style="min-width: 60px;">
                                        <div class="position-relative d-inline-block">
                                            ${u.photo
                ? `<img src="${u.photo}" class="rounded-circle border border-2 border-warning" style="width: 40px; height: 40px; object-fit: cover;">`
                : `<div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center border border-2 border-warning" style="width: 40px; height: 40px; font-size: 0.8rem;">${(u.name ? u.name.charAt(0) : '?')}</div>`
            }
                                        </div>
                                        <div style="font-size: 0.65rem;" class="mt-1 text-truncate w-100">${u.name.split(' ')[0]}</div>
                                        <div class="badge bg-warning text-dark" style="font-size: 0.5rem;">${new Date(u.birthDate).getDate()}</div>
                                    </div>
                                `).join('') : `<small class="text-muted fst-italic">Tidak ada yang ultah.</small>`}
                            </div>
                        </div>

                        <div class="bento-card bento-col-4 bento-row-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="fw-bold mb-0"><i class="bi bi-megaphone-fill text-danger me-2"></i>Pengumuman</h6>
                            </div>
                            <div class="d-flex flex-column gap-3 overflow-auto custom-scrollbar">
                                ${announcements.map(a => {
                const c = a.color || 'primary';
                const icons = { primary: 'bi-info-circle-fill', danger: 'bi-megaphone-fill', warning: 'bi-exclamation-triangle-fill', success: 'bi-check-circle-fill' };
                return `<div class="p-3 rounded-3 bg-${c}-subtle border border-${c} border-opacity-10">
                                        <div class="d-flex gap-3">
                                            <div class="text-${c} fs-4"><i class="bi ${icons[c] || icons.primary}"></i></div>
                                            <div class="w-100">
                                                <div class="d-flex justify-content-between align-items-center mb-1">
                                                    <strong class="text-dark">${a.title}</strong>
                                                    <span class="badge bg-white text-${c} border border-${c} border-opacity-25 shadow-sm">${a.date}</span>
                                                </div>
                                                <p class="mb-0 text-secondary small">${a.content}</p>
                                            </div>
                                        </div>
                                    </div>`;
            }).join('')}
                            </div>
                        </div>
                        <div class="bento-card bento-col-4 card-hover">
                            <div class="d-flex align-items-center mb-3">
                                <div class="bg-info-subtle p-2 rounded-3 text-info me-3"><i class="bi bi-calendar-event fs-4"></i></div>
                                <h6 class="mb-0 text-muted">Jadwal Hari Ini (${today})</h6>
                            </div>
                            ${todaySchedules.length > 0 ? `
                                <div class="d-flex flex-column gap-2 overflow-auto custom-scrollbar" style="max-height: 200px;">
                                    ${todaySchedules.map(s => `
                                        <div class="p-2 border rounded bg-light">
                                            <div class="d-flex justify-content-between">
                                                <span class="fw-bold text-dark">${s.subject}</span>
                                                <span class="badge bg-primary">${s.time}</span>
                                            </div>
                                            <div class="small text-muted mt-1"><i class="bi bi-geo-alt me-1"></i>${s.room} | <i class="bi bi-people me-1"></i>${s.picket}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-4 text-muted">
                                    <i class="bi bi-emoji-smile fs-1 d-block mb-2"></i>
                                    <p class="mb-0">Tidak ada jadwal kuliah hari ini.</p>
                                </div>
                            `}
                        </div>
                        <div class="bento-card bento-col-4 bento-row-2">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="fw-bold mb-0">Statistik Pembayaran Kas (2024-2028)</h6>
                            </div>
                            <div class="flex-grow-1 position-relative" style="min-height: 300px;">
                                <canvas id="kasChart"></canvas>
                            </div>
                        </div>
                    </div>
                `;
        setTimeout(() => {
            const ctx1 = document.getElementById('attendanceChart');
            if (ctx1) {
                new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
                        datasets: [{ label: 'Hadir', data: attendanceData, borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.1)', fill: true, tension: 0.4 }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: totalUsers,
                                ticks: { stepSize: 1, precision: 0 },
                                grid: { display: false }
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }

            const ctx2 = document.getElementById('kasChart');
            if (ctx2) {
                const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6610f2'];
                const datasets = years.map((year, index) => ({
                    label: year.toString(),
                    data: kasStats[year],
                    borderColor: colors[index],
                    backgroundColor: colors[index] + '20', // Transparent version
                    fill: false,
                    tension: 0.3
                }));

                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: 'Jumlah Mahasiswa' },
                                max: kasData.length,
                                ticks: {
                                    stepSize: 1,
                                    precision: 0
                                }
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }

            // Quote Rotator
            const quoteElement = document.getElementById('dashboard-quote');
            if (quoteElement && quotes.length > 1) {
                this.quoteInterval = setInterval(() => {
                    if (!document.getElementById('dashboard-quote')) {
                        clearInterval(this.quoteInterval);
                        return;
                    }

                    // 1. Fade Out
                    quoteElement.classList.add('quote-hidden');

                    // 2. Wait for transition, then change text and Fade In
                    setTimeout(() => {
                        quoteIndex = (quoteIndex + 1) % quotes.length;
                        const newQuote = quotes[quoteIndex];
                        quoteElement.innerText = `"${newQuote.q}" - ${newQuote.a}`;
                        quoteElement.classList.remove('quote-hidden');
                    }, 500); // Match CSS transition time
                }, 5000);
            }
        }, 100);
    },

    // ... (Keep existing functions: submitPermission, viewGalleryImage, showUploadModal, renderMembers, showAddMemberModal, renderSchedule, renderKas, toggleKas, showProfile, handlePermission, renderComplaints, renderAbout, renderAdmin, renderSidebar, etc.) ...
    showToast: function (message, type = 'danger') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;

        const icon = type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger';
        const title = type === 'success' ? 'Berhasil' : 'Gagal';
        const bgClass = type === 'success' ? 'bg-success-subtle' : 'bg-danger-subtle';

        toast.innerHTML = `
                    <div class="d-flex align-items-center justify-content-center rounded-circle ${bgClass}" style="width: 40px; height: 40px; min-width: 40px;">
                        <i class="bi ${icon} fs-5"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold mb-1" style="font-size: 0.95rem;">${title}</div>
                        <div class="text-muted small" style="line-height: 1.4;">${message}</div>
                    </div>
                    <button type="button" class="btn-close small ms-2" onclick="this.parentElement.remove()"></button>
                `;

        container.appendChild(toast);

        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },

    previewProof: function (url) {
        if (!url) return;

        const isMobile = window.innerWidth < 768;
        const height = isMobile ? '50vh' : '80vh';

        let contentHtml = '';
        // Check if it's an image
        if (url.startsWith('data:image') || url.match(/\.(jpeg|jpg|png)$/i)) {
            contentHtml = `<img src="${url}" class="img-fluid rounded-3 shadow-lg" style="max-height: ${height};">`;
        } else {
            // For PDF and others
            contentHtml = `
                <div class="bg-white rounded-3 overflow-hidden position-relative" style="height: ${height};">
                    <object data="${url}" type="application/pdf" width="100%" height="100%">
                        <div class="d-flex align-items-center justify-content-center h-100 flex-column bg-light p-3 text-center">
                            <i class="bi bi-file-earmark-pdf fs-1 text-muted mb-3"></i>
                            <p class="text-muted mb-3 small">Preview tidak tersedia.</p>
                            <a href="${url}" download class="btn btn-primary btn-sm"><i class="bi bi-download me-2"></i>Download PDF</a>
                        </div>
                    </object>
                </div>`;
        }

        const modalHtml = `
                    <div class="modal fade" id="previewModal" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered modal-xl">
                            <div class="modal-content border-0 bg-transparent shadow-none">
                                <div class="modal-body p-0 text-center position-relative">
                                    <button type="button" class="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow-sm d-flex align-items-center justify-content-center" data-bs-dismiss="modal" style="width: 32px; height: 32px; z-index: 1050;"><i class="bi bi-x-lg"></i></button>
                                    ${contentHtml}
                                </div>
                            </div>
                        </div>
                    </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        new bootstrap.Modal(document.getElementById('previewModal')).show();
    },

    submitPermission: async function () {
        const type = document.getElementById('reqType').value;
        const date = document.getElementById('reqDate').value;
        const reason = document.getElementById('reqReason').value;
        const fileInput = document.getElementById('reqFile');
        const file = fileInput.files[0];

        if (!date || !reason) return this.showToast("Mohon lengkapi tanggal dan alasan.", 'danger');

        let proofUrl = null;
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                return this.showToast("Format file tidak didukung! Gunakan JPG, PNG, PDF, atau Word.", 'danger');
            }
            if (file.size > 2 * 1024 * 1024) {
                return this.showToast("Ukuran file maksimal 2MB.", 'danger');
            }

            // Convert to Base64
            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            try {
                proofUrl = await toBase64(file);
            } catch (e) {
                return this.showToast("Gagal memproses file.", 'danger');
            }
        }

        const newReq = {
            user: this.currentUser.name,
            type: type,
            reason: reason,
            date: date,
            status: 'pending',
            proof: proofUrl
        };

        try {
            const response = await fetch(`${API_URL}/permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReq)
            });
            if (response.ok) {
                this.showToast("Pengajuan berhasil dikirim!", 'success');
                this.renderRequests(document.getElementById('page-container'));
            } else {
                this.showToast("Gagal mengirim pengajuan.", 'danger');
            }
        } catch (error) {
            console.error('Error submitting permission:', error);
            this.showToast("Terjadi kesalahan server.", 'danger');
        }
    },
    viewGalleryImage: async function (id) {
        const response = await fetch(`${API_URL}/gallery`);
        const gallery = await response.json();
        const img = gallery.find(g => g.id === id); if (!img) return;

        // Escape quotes for safe HTML attribute usage
        const safeDesc = img.desc.replace(/'/g, "\\'").replace(/"/g, "&quot;");

        const modalHtml = `
        <div class="modal fade" id="galleryViewModal" tabindex="-1">
            <div class="modal-dialog modal-xl modal-dialog-centered"> <!-- Reverted to XL, not Fullscreen -->
                <div class="modal-content border-0 overflow-hidden shadow-lg" style="border-radius: 24px;">
                    <div class="modal-body p-0">
                        <div class="row g-0">
                            <!-- Image Section -->
                            <div class="col-lg-8 bg-black d-flex align-items-center justify-content-center position-relative overflow-hidden" style="min-height: 500px; background-image: radial-gradient(circle at center, #333 0%, #000 100%);">
                                <img src="${img.url}" class="profile-zoom" style="max-height: 80vh; max-width: 100%; object-fit: contain; cursor: zoom-in;" onclick="app.viewFullPhoto('${img.url}', '${safeDesc}')">
                                <div class="position-absolute bottom-0 end-0 m-3">
                                    <button class="btn btn-light bg-opacity-75 rounded-circle shadow-sm" onclick="app.viewFullPhoto('${img.url}', '${safeDesc}')" title="Zoom Fullscreen">
                                        <i class="bi bi-arrows-fullscreen"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Details Section -->
                            <div class="col-lg-4 p-4 d-flex flex-column bg-white">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h5 class="fw-bold mb-0">Detail Foto</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button> <!-- Standard Close Button in Header -->
                                </div>
                                <div class="mb-4">
                                    <small class="text-muted text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 1px;">Deskripsi</small>
                                    <p class="fs-6 mb-0 mt-2 text-dark" style="line-height:1.6;">${img.desc}</p>
                                </div>
                                <div class="mt-auto">
                                    <hr class="border-secondary opacity-10">
                                    <div class="d-flex align-items-center">
                                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style="width:40px;height:40px;">
                                            <i class="bi bi-person-fill fs-5"></i>
                                        </div>
                                        <div class="lh-1">
                                            <div class="small fw-bold text-dark">${img.uploader || 'Admin'}</div>
                                            <small class="text-muted" style="font-size: 11px;">${img.date || 'Update Terbaru'}</small>
                                        </div>
                                    </div>
                                    
                                    ${this.currentUser.role === 'superadmin' ? `
                                    <div class="mt-4 pt-3 border-top">
                                        <button class="btn btn-outline-danger w-100 btn-sm rounded-pill" onclick="app.deleteGalleryImage(${img.id})">
                                            <i class="bi bi-trash me-2"></i> Hapus Foto
                                        </button>
                                    </div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        new bootstrap.Modal(document.getElementById('galleryViewModal')).show();
    },
    renderGallery: async function (c) {
        const isAdmin = this.currentUser.role === 'superadmin';
        const response = await fetch(`${API_URL}/gallery`);
        const allGallery = await response.json();
        const gallery = allGallery.filter(g => g.category === 'general' || !g.category); // Only general photos here
        const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";

        c.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0">Galeri Kenangan</h5>
            <div class="d-flex gap-2">
                <button class="btn btn-warning text-white shadow-sm fw-bold" onclick="app.showHallOfFameModal()">
                    <i class="bi bi-trophy-fill me-2"></i> Hall of Fame/Shame
                </button>
                ${isAdmin ? `<button class="btn btn-primary shadow-sm" onclick="app.showUploadModal()"><i class="bi bi-cloud-arrow-up me-2"></i> Upload Foto</button>` : ''}
            </div>
        </div>
        <div class="row g-4" id="galleryGrid">
            ${gallery.length > 0 ? gallery.map(g => `
            <div class="col-md-6 col-lg-3">
                <div class="bento-card p-0 overflow-hidden h-100 border-0 shadow-sm card-hover gallery-card">
                    <div class="position-relative h-100" onclick="app.viewGalleryImage(${g.id})" style="cursor: pointer;">
                        <div class="skeleton position-absolute top-0 start-0 w-100 h-100 z-2"></div>
                        <img data-src="${g.url}" src="${placeholder}" class="lazy-gallery-img gallery-img rounded-0 w-100 object-fit-cover position-relative z-1" style="height: 200px;" loading="lazy">
                        <div class="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-dark text-white z-3" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                            <small class="fw-bold text-white text-shadow text-truncate d-block">${g.desc}</small>
                        </div>
                        ${isAdmin ? `<button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 shadow-sm btn-delete-gallery z-3" onclick="event.stopPropagation(); app.deleteGalleryImage(${g.id})"><i class="bi bi-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>`).join('') : '<div class="col-12 text-center text-muted py-5">Belum ada foto kenangan.</div>'}
        </div>`;

        // Observer Logic
        const observerOptions = { rootMargin: '200px', threshold: 0.01 };
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.onload = function () {
                            const skeleton = this.previousElementSibling;
                            if (skeleton && skeleton.classList.contains('skeleton')) {
                                skeleton.style.display = 'none';
                            }
                        };
                        img.src = img.dataset.src;
                        img.classList.remove('lazy-gallery-img');
                        observer.unobserve(img);
                    }
                }
            });
        }, observerOptions);

        const lazyImages = c.querySelectorAll('.lazy-gallery-img');
        lazyImages.forEach(img => imageObserver.observe(img));
    },

    showHallOfFameModal: async function() {
        const response = await fetch(`${API_URL}/gallery`);
        const allGallery = await response.json();
        const fame = allGallery.filter(g => g.category === 'fame');
        const shame = allGallery.filter(g => g.category === 'shame');
        const isAdmin = this.currentUser.role === 'superadmin';

        const renderGrid = (items, emptyText) => {
            if (items.length === 0) return `<div class="text-center py-5 text-muted">${emptyText}</div>`;
            return `<div class="row g-3">
                ${items.map(g => `
                <div class="col-6 col-md-4">
                    <div class="card h-100 border-0 shadow-sm overflow-hidden">
                        <div style="height: 150px; background: #eee;">
                            <img src="${g.url}" class="w-100 h-100 object-fit-cover">
                        </div>
                        <div class="card-body p-2 bg-white">
                            <small class="fw-bold d-block text-truncate">${g.desc}</small>
                            <small class="text-muted" style="font-size: 0.7rem;">${g.date}</small>
                            ${isAdmin ? `<button class="btn btn-xs btn-outline-danger w-100 mt-2" onclick="app.deleteGalleryImage(${g.id}, true)">Hapus</button>` : ''}
                        </div>
                    </div>
                </div>`).join('')}
            </div>`;
        };

        const modalHtml = `
            <div class="modal fade" id="hofModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div class="modal-content bento-card border-0">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fw-bold"><i class="bi bi-trophy-fill text-warning me-2"></i> Hall of Fame & Shame</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body pt-2">
                            <ul class="nav nav-tabs nav-fill mb-3" id="hofTabs" role="tablist">
                                <li class="nav-item">
                                    <button class="nav-link active fw-bold text-success" id="fame-tab" data-bs-toggle="tab" data-bs-target="#fame-pane" type="button">
                                        🏆 Hall of Fame
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link fw-bold text-danger" id="shame-tab" data-bs-toggle="tab" data-bs-target="#shame-pane" type="button">
                                        🤡 Hall of Shame
                                    </button>
                                </li>
                            </ul>
                            <div class="tab-content" id="hofContent">
                                <div class="tab-pane fade show active" id="fame-pane">
                                    ${renderGrid(fame, 'Belum ada mahasiswa berprestasi / membanggakan.')}
                                </div>
                                <div class="tab-pane fade" id="shame-pane">
                                    ${renderGrid(shame, 'Belum ada kejadian memalukan (aman bos!).')}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            ${isAdmin ? '<small class="text-muted w-100 text-center">Untuk menambah, gunakan tombol Upload di halaman Galeri dan pilih kategorinya.</small>' : ''}
                        </div>
                    </div>
                </div>
            </div>`;
        
        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('hofModal'));
        modal.show();
    },
    deleteGalleryImage: function (id, refreshModal = false) {
        if(!confirm('Hapus foto ini?')) return;
        fetch(`${API_URL}/gallery/${id}`, { method: 'DELETE' })
            .then(res => {
                if(res.ok) {
                    if(refreshModal) { 
                        // Close current modal to refresh data, or re-fetch. Simplest to close and re-open or just hide for now.
                        // Actually better to just reload the modal
                        bootstrap.Modal.getInstance(document.getElementById('hofModal')).hide();
                        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                        setTimeout(() => this.showHallOfFameModal(), 300); 
                    } else {
                        this.renderGallery(document.getElementById('page-container'));
                    }
                }
            });
    },
    handleFileSelect: function (input) {
        const file = input.files[0];
        const label = document.getElementById('fileLabel');
        const container = input.parentElement;

        if (file) {
            // Show loading state
            label.innerHTML = `<div class="spinner-border text-primary mb-2" role="status"></div><div class="small fw-bold text-muted">Memproses file...</div>`;

            // Simulate processing delay
            setTimeout(() => {
                // Change shape/style to a "File Card"
                container.className = "p-3 rounded-3 border bg-light-subtle d-flex align-items-center gap-3 position-relative overflow-hidden";
                container.style.borderStyle = "solid"; // Reset dashed
                container.style.borderColor = "var(--bs-primary-border-subtle)";

                // Determine icon based on type
                let icon = 'bi-file-earmark-text';
                if (file.type.includes('image')) icon = 'bi-file-earmark-image';
                if (file.type.includes('pdf')) icon = 'bi-file-earmark-pdf';

                label.className = "flex-grow-1 text-start";
                label.innerHTML = `
                            <div class="d-flex justify-content-between align-items-center w-100">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="bg-white p-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width:40px;height:40px">
                                        <i class="bi ${icon} fs-5 text-primary"></i>
                                    </div>
                                    <div>
                                        <div class="fw-bold text-truncate" style="max-width: 180px;">${file.name}</div>
                                        <div class="small text-muted">${(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-danger rounded-circle" onclick="event.stopPropagation(); document.getElementById('reqFile').value=''; app.handleFileSelect(document.getElementById('reqFile'));"><i class="bi bi-x"></i></button>
                            </div>
                        `;
            }, 800);
        } else {
            // Reset to default
            container.className = "p-4 rounded-3 text-center border position-relative";
            container.style.borderStyle = "dashed";
            label.className = "text-muted";
            label.innerHTML = `<i class="bi bi-cloud-arrow-up fs-3 mb-2 d-block opacity-50"></i><span class="small fw-bold opacity-75">Klik untuk upload file</span>`;
        }
    },
    renderRequests: async function (c) {
        const isAdmin = this.currentUser.role === 'superadmin';
        const response = await fetch(`${API_URL}/permissions`);
        const permissionsAll = await response.json();
        const permissions = isAdmin ? permissionsAll : permissionsAll.filter(p => p.user === this.currentUser.name);
        c.innerHTML = `<div class="row g-4"><div class="col-lg-4"><div class="bento-card"><h5 class="fw-bold mb-4">Buat Pengajuan</h5><form onsubmit="event.preventDefault(); app.submitPermission();"><div class="mb-3"><label class="form-label small fw-bold">Jenis Izin</label><select id="reqType" class="form-select"><option>Sakit</option><option>Izin</option></select></div><div class="mb-3"><label class="form-label small fw-bold">Tanggal</label><input type="date" id="reqDate" class="form-control"></div><div class="mb-3"><label class="form-label small fw-bold d-flex justify-content-between">Alasan <button type="button" id="btn-refine-perm" onclick="app.refinePermission()" class="btn btn-sm btn-primary py-0" style="font-size:10px">✨ Formalin Bahasa</button></label><textarea id="reqReason" class="form-control" rows="3" placeholder="Contoh: sakit perut"></textarea></div><div class="mb-4"><label class="form-label small fw-bold">Bukti (PDF/JPG/PNG/Word)</label><div class="p-4 rounded-3 text-center border position-relative" style="border-style: dashed !important; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('reqFile').click()" onmouseover="this.classList.add('bg-light-subtle', 'border-primary')" onmouseout="this.classList.remove('bg-light-subtle', 'border-primary')"><input type="file" id="reqFile" class="d-none" accept=".pdf, .jpg, .jpeg, .png, .doc, .docx" onchange="app.handleFileSelect(this)"><div id="fileLabel" class="text-muted"><i class="bi bi-cloud-arrow-up fs-3 mb-2 d-block opacity-50"></i><span class="small fw-bold opacity-75">Klik untuk upload file</span></div></div><div class="form-text small text-danger mt-2 fw-bold"><i class="bi bi-info-circle me-1"></i>Maksimal 2MB</div></div><button type="submit" class="btn btn-primary w-100 fw-bold py-2">Ajukan Permohonan</button></form></div></div><div class="col-lg-8"><div class="bento-card"><h5 class="fw-bold mb-3">Riwayat Pengajuan</h5><div class="table-responsive"><table class="table table-hover align-middle" style="min-width: 600px;"><thead class="table-light"><tr><th>Nama</th><th>Tipe & Alasan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${permissions.map(p => `<tr><td class="fw-bold small">${p.user}<div class="text-muted" style="font-size: 10px;">${p.date}</div></td><td><span class="badge bg-light text-dark border me-1">${p.type}</span> <span class="small">${p.reason}</span>${p.proof && isAdmin ? `<div class="mt-1"><button onclick="app.previewProof('${p.proof}')" class="btn btn-link p-0 text-decoration-none small text-primary border-0 bg-transparent"><i class="bi bi-paperclip"></i> Bukti</button></div>` : ''}</td><td><span class="badge bg-${p.status === 'approved' ? 'success' : (p.status === 'rejected' ? 'danger' : 'warning')}">${p.status}</span></td><td>${isAdmin && p.status === 'pending' ? `<div class="btn-group btn-group-sm"><button class="btn btn-success" onclick="app.handlePermission(${p.id}, 'approved')"><i class="bi bi-check-lg"></i></button><button class="btn btn-danger" onclick="app.handlePermission(${p.id}, 'rejected')"><i class="bi bi-x-lg"></i></button></div>` : 'Assigned'}</td></tr>`).join('')}</tbody></table></div></div></div></div>`;
    },
    showUploadModal: function () {
        const modalHtml = `<div class="modal fade" id="uploadModal" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content border-0 rounded-4"><div class="modal-header border-0"><h5 class="modal-title fw-bold">Upload Foto</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><form id="uploadForm">
        <div id="drop-area" class="drag-drop-zone mb-3 d-flex flex-column align-items-center justify-content-center"><div id="preview-container" class="d-none w-100 mb-2"><img id="img-preview" src="" class="img-fluid rounded-3 shadow-sm" style="max-height: 200px;"></div><div id="upload-instruction"><i class="bi bi-cloud-arrow-up fs-1 text-primary opacity-50"></i><p class="mb-0 mt-2 fw-bold text-muted">Drag & Drop atau Klik</p></div><input type="file" id="fileElem" accept="image/*" class="d-none"></div>
        <div class="mb-3"><label class="fw-bold small">Kategori</label><select id="uCategory" class="form-select"><option value="general">📸 Dokumentasi (General)</option><option value="fame">🏆 Hall of Fame</option><option value="shame">🤡 Hall of Shame</option></select></div>
        <div class="mb-3"><label class="fw-bold small d-flex justify-content-between">Deskripsi <button type="button" id="btn-gen-caption" class="btn btn-sm btn-primary py-0" style="font-size:10px">✨ Buat Caption Otomatis</button></label><input type="text" id="uDesc" class="form-control" required placeholder="Kegiatan apa ini?"></div><button type="submit" class="btn btn-primary w-100 fw-bold">Posting ke Galeri</button></form></div></div></div></div>`;
        document.getElementById('modal-container').innerHTML = modalHtml; const modal = new bootstrap.Modal(document.getElementById('uploadModal')); modal.show();
        const dropArea = document.getElementById('drop-area'), fileElem = document.getElementById('fileElem'), imgPreview = document.getElementById('img-preview'), previewContainer = document.getElementById('preview-container'), instructions = document.getElementById('upload-instruction'); let selectedFile = null;
        dropArea.addEventListener('click', () => fileElem.click());
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false));
        ['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false));
        ['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false));
        const handleFiles = (file) => { if (!file.type.startsWith('image/')) return app.showToast("Hanya file gambar!", 'danger'); selectedFile = file; const reader = new FileReader(); reader.onload = (e) => { imgPreview.src = e.target.result; previewContainer.classList.remove('d-none'); instructions.classList.add('d-none'); document.getElementById('btn-gen-caption').onclick = () => app.generateCaption(e.target.result); }; reader.readAsDataURL(file); };
        dropArea.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files[0]); });
        fileElem.addEventListener('change', () => { if (fileElem.files[0]) handleFiles(fileElem.files[0]); });
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedFile) return app.showToast("Pilih foto dulu!", 'danger');
            
            // Convert to base64 for simple storage
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = async () => {
                const base64 = reader.result;
                try {
                    const response = await fetch(`${API_URL}/gallery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: base64,
                            desc: document.getElementById('uDesc').value,
                            category: document.getElementById('uCategory').value,
                            uploader: this.currentUser.name,
                            date: new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) 
                        })
                    });
                    if (response.ok) {
                        modal.hide();
                        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                        this.renderGallery(document.getElementById('page-container'));
                    } else {
                        app.showToast("Gagal upload.", 'danger');
                    }
                } catch (err) {
                    console.error(err);
                    app.showToast("Error uploading.", 'danger');
                }
            };
        });
    },
    renderMembers: async function (container) {
        const isAdmin = this.currentUser.role === 'superadmin';
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        const sortedUsers = [...users].sort((a, b) => (POSITION_PRIORITY[a.position] || 99) - (POSITION_PRIORITY[b.position] || 99));
        const filteredUsers = sortedUsers.filter(u => u.name.toLowerCase().includes(this.memberSearchTerm.toLowerCase()) || u.nim.includes(this.memberSearchTerm));
        let html = `<div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3"><div class="position-relative"><i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i><input type="text" id="memberSearch" class="form-control ps-5 rounded-pill border-0 shadow-sm" placeholder="Cari teman..." value="${this.memberSearchTerm}" style="width: 250px;"></div>${isAdmin ? `<button class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold" onclick="app.showAddMemberModal()"><i class="bi bi-person-plus-fill me-2"></i>Tambah</button>` : ''}</div>`;

        if (filteredUsers.length === 0) html += `<div class="col-12 text-center text-muted py-5"><i class="bi bi-emoji-frown fs-1"></i><p>Tidak ada anggota ditemukan.</p></div>`;
        else {
            // Carousel Container (Paged 4x4)
            html += `
            <div class="position-relative w-100">
                <button class="btn btn-light position-absolute top-50 start-0 translate-middle-y z-3 shadow rounded-circle d-none d-md-block" style="width: 45px; height: 45px;" onclick="document.getElementById('memberCarousel').scrollBy({left: -document.getElementById('memberCarousel').clientWidth, behavior: 'smooth'})"><i class="bi bi-chevron-left"></i></button>
                
                <div id="memberCarousel" class="d-flex overflow-x-auto w-100" style="scroll-behavior: smooth; scroll-snap-type: x mandatory;">
            `;

            // Split into chunks of 8 (4 columns x 2 rows)
            const chunkSize = 8;
            for (let i = 0; i < filteredUsers.length; i += chunkSize) {
                const chunk = filteredUsers.slice(i, i + chunkSize);

                // Slide Block (One Page)
                html += `<div class="flex-shrink-0 w-100 p-1" style="scroll-snap-align: start;">
                            <div class="row g-3 row-cols-2 row-cols-md-4">`;

                chunk.forEach(u => {
                    const hasPhoto = u.hasPhoto;
                    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";

                    let avatarHtml = hasPhoto
                        ? `<div class="position-relative d-inline-block mb-3">
                                <div class="avatar-skeleton skeleton position-absolute top-0 start-0 z-2"></div>
                                <img data-src="${API_URL}/users/${u.id}/photo" src="${placeholder}" class="lazy-member-img avatar-circle position-relative z-1" loading="lazy" 
                                onerror="this.onerror=null;this.parentNode.innerHTML='<div class=\\'bg-primary bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow\\' style=\\'width: 80px; height: 80px; font-size: 2rem;\\'>${u.name.charAt(0)}</div>'">
                           </div>`
                        : `<div class="bg-primary bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style="width: 80px; height: 80px; font-size: 2rem;">${u.name.charAt(0)}</div>`;

                    if (isAdmin && !hasPhoto) {
                        // For admin, add edit button wrapper if no photo (if photo exists, logic is handled above inside wrapper)
                        const cleanAvatar = avatarHtml.replace('mb-3', '');
                        avatarHtml = `
                        <div class="position-relative d-inline-block mb-3" onclick="app.editMemberPhoto(${u.id})" style="cursor: pointer;">
                            ${cleanAvatar}
                            <div class="position-absolute bottom-0 end-0 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center border" 
                                style="width: 32px; height: 32px;">
                                <i class="bi bi-camera-fill text-primary" style="font-size: 14px;"></i>
                            </div>
                        </div>`;
                    } else if (isAdmin && hasPhoto) {
                        // Modifikasi avatarHtml yang sudah ada structurenya
                        // Kita perlu inject tombol edit ke dalam wrapper yang sudah dibuat
                        // Tapi karena avatarHtml string manipulation agak ribet, kita bungkus ulang saja
                        // Logic di atas membungkus lagi, kita harus hati-hati double wrapper

                        // Simplification: Rebuild logic for hasPhoto + isAdmin
                        avatarHtml = `
                         <div class="position-relative d-inline-block mb-3" onclick="app.editMemberPhoto(${u.id})" style="cursor: pointer;">
                                <div class="avatar-skeleton skeleton position-absolute top-0 start-0 z-2" style="border-radius: 50%;"></div>
                                <img data-src="${API_URL}/users/${u.id}/photo" src="${placeholder}" class="lazy-member-img avatar-circle position-relative z-1" loading="lazy" 
                                onerror="this.onerror=null;this.parentElement.outerHTML='<div class=\\'bg-primary bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow\\' style=\\'width: 80px; height: 80px; font-size: 2rem;\\'>${u.name.charAt(0)}</div>'">
                            <div class="position-absolute bottom-0 end-0 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center border z-3" 
                                style="width: 32px; height: 32px;">
                                <i class="bi bi-camera-fill text-primary" style="font-size: 14px;"></i>
                            </div>
                        </div>`;
                    }

                    // Card Item
                    html += `
                    <div class="col">
                        <div class="bento-card h-100 border-0 shadow-sm text-center p-3 card-hover position-relative">
                            <div class="card-body p-0">
                                ${avatarHtml}
                                <h5 class="fw-bold mb-1 text-capitalize text-truncate" style="font-size: 0.95rem;">${u.name.toLowerCase()}</h5>
                                <p class="text-muted small mb-2" style="font-size: 0.8rem;">${u.nim}</p>
                                <span class="badge ${POSITION_PRIORITY[u.position] < 10 ? 'bg-primary' : 'bg-light text-dark border'} rounded-pill px-3 py-1 mb-2 small">${u.position}</span>
                                <br>
                                <button class="btn btn-primary btn-sm rounded-pill px-3 fw-bold" style="font-size: 0.8rem;" onclick="app.showProfile(${u.id})">Lihat Profil</button>
                            </div>
                            ${isAdmin ? `
                                <div class="position-absolute top-0 end-0 m-2 d-flex gap-1" style="z-index: 10;">
                                    <button class="btn btn-warning text-white btn-sm shadow-sm rounded-circle d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" onclick="app.showEditMemberModal(${u.id})" title="Edit"><i class="bi bi-pencil-fill" style="font-size: 0.7rem;"></i></button>
                                    <button class="btn btn-danger btn-sm shadow-sm rounded-circle d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" onclick="app.deleteMember(${u.id})" title="Hapus"><i class="bi bi-trash" style="font-size: 0.8rem;"></i></button>
                                </div>
                            ` : ''}
                        </div>
                    </div>`;
                });

                // Fill empty slots if last page is incomplete?
                // No need, standard grid handles it.
                html += `   </div>
                        </div>`;
            }

            html += `
                </div>
                <button class="btn btn-light position-absolute top-50 end-0 translate-middle-y z-3 shadow rounded-circle d-none d-md-block" style="width: 45px; height: 45px;" onclick="document.getElementById('memberCarousel').scrollBy({left: document.getElementById('memberCarousel').clientWidth, behavior: 'smooth'})"><i class="bi bi-chevron-right"></i></button>
            </div>`;
        }

        container.innerHTML = html;

        // --- Intersection Observer (Unchanged Logic, works for new structure) ---
        if (filteredUsers.length > 0) {
            const observerOptions = {
                root: document.getElementById('memberCarousel'),
                rootMargin: '200px', // Preload images 200px before they enter viewport
                threshold: 0.01 // Trigger as soon as 1% is visible
            };

            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            // Attach load handler before setting src to ensure we capture the real image load
                            img.onload = function () {
                                // Hide skeleton brother
                                const skeleton = this.previousElementSibling;
                                if (skeleton && skeleton.classList.contains('skeleton')) {
                                    skeleton.style.display = 'none';
                                }
                            };

                            img.src = img.dataset.src; // LOAD IMAGE
                            img.removeAttribute('data-src');
                            img.classList.remove('bg-secondary', 'bg-opacity-10');
                            observer.unobserve(img);
                        }
                    }
                });
            }, observerOptions);

            const lazyImages = container.querySelectorAll('.lazy-member-img');
            lazyImages.forEach(img => imageObserver.observe(img));
        }

        setTimeout(() => { const searchInput = document.getElementById('memberSearch'); if (searchInput) { searchInput.focus(); const val = searchInput.value; searchInput.value = ''; searchInput.value = val; searchInput.addEventListener('input', (e) => { this.memberSearchTerm = e.target.value; this.renderMembers(container); }); } }, 0);
    },
    deleteMember: function (id) {
        const modalHtml = `
                    <div class="modal fade" id="deleteMemberModal" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered modal-sm">
                            <div class="modal-content border-0 rounded-4 shadow-lg">
                                <div class="modal-body text-center p-4">
                                    <div class="mb-3 text-danger">
                                        <i class="bi bi-person-x-fill" style="font-size: 3rem;"></i>
                                    </div>
                                    <h5 class="fw-bold mb-2">Hapus Anggota?</h5>
                                    <p class="text-muted small mb-4">Data anggota akan dihapus permanen.</p>
                                    <div class="d-flex gap-2 justify-content-center">
                                        <button type="button" class="btn btn-light rounded-pill px-4 fw-bold" data-bs-dismiss="modal">Batal</button>
                                        <button type="button" id="confirmDeleteMemberBtn" class="btn btn-danger rounded-pill px-4 fw-bold">Hapus</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;

        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('deleteMemberModal'));
        modal.show();

        document.getElementById('confirmDeleteMemberBtn').onclick = async () => {
            try {
                const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    modal.hide();
                    this.renderMembers(document.getElementById('page-container'));
                } else {
                    app.showToast("Gagal menghapus anggota.", 'danger');
                }
            } catch (err) {
                console.error(err);
                app.showToast("Error deleting member.", 'danger');
            }
        };
    },

    editMemberPhoto: function (id) {
        const modalHtml = `
            <div class="modal fade" id="editPhotoModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold">Ganti Foto Profil</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form onsubmit="event.preventDefault(); app.submitMemberPhoto(${id})">
                                <div class="mb-3 text-center">
                                    <div id="photo-preview-container" class="mb-3">
                                        <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 120px; height: 120px;">
                                            <i class="bi bi-person fs-1 text-muted"></i>
                                        </div>
                                    </div>
                                    <input type="file" id="newPhotoFile" class="form-control" accept="image/*" onchange="app.previewNewPhoto(this)">
                                </div>
                                <button type="submit" class="btn btn-primary w-100 fw-bold">Simpan Foto</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        new bootstrap.Modal(document.getElementById('editPhotoModal')).show();
    },

    previewNewPhoto: function (input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('photo-preview-container').innerHTML = `<img src="${e.target.result}" class="rounded-circle shadow-sm" style="width: 120px; height: 120px; object-fit: cover;">`;
            }
            reader.readAsDataURL(input.files[0]);
        }
    },

    submitMemberPhoto: async function (id) {
        const fileInput = document.getElementById('newPhotoFile');
        if (!fileInput.files[0]) return this.showToast("Pilih foto baru!", 'danger');

        try {
            // Revert back to Base64 JSON upload
            const base64 = await this.compressImage(fileInput.files[0]);

            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: base64 })
            });

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('editPhotoModal')).hide();
                this.showToast("Foto berhasil diperbarui!", 'success');
                this.renderMembers(document.getElementById('page-container'));
            } else {
                this.showToast("Gagal memperbarui foto.", 'danger');
            }
        } catch (err) {
            console.error(err);
            this.showToast("Terjadi kesalahan.", 'danger');
        }
    },
    showAddMemberModal: function () {
        const modalHtml = `
            <div class="modal fade" id="memberModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold">Tambah Anggota</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="memberForm">
                                <div class="mb-3">
                                    <label class="small fw-bold">Nama Lengkap</label>
                                    <input type="text" id="mName" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">NIM (Username)</label>
                                    <input type="text" id="mNim" class="form-control" required>
                                </div>
                                <div class="row">
                                    <div class="col-6 mb-3">
                                        <label class="small fw-bold">Tanggal Lahir</label>
                                        <input type="date" id="mBirthDate" class="form-control">
                                    </div>
                                    <div class="col-6 mb-3">
                                        <label class="small fw-bold">No. HP (WA)</label>
                                        <input type="tel" id="mPhone" class="form-control" placeholder="628xxx">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">Posisi</label>
                                    <select id="mPos" class="form-select">
                                        <option value="Anggota">Anggota</option>
                                        <option value="Komting">Komting</option>
                                        <option value="Wakil Komting">Wakil Komting</option>
                                        <option value="Sekretaris">Sekretaris</option>
                                        <option value="Bendahara">Bendahara</option>
                                        <option value="Anggota Inti">Anggota Inti</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">Foto Profil</label>
                                    <input type="file" id="mPhoto" accept="image/*" class="form-control">
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">Bio Singkat</label>
                                    <textarea id="mBio" class="form-control" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 fw-bold py-2">Simpan Data</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('memberModal'));
        modal.show();

        document.getElementById('memberForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const photoInput = document.getElementById('mPhoto');

            const submitUser = async (photo) => {
                const newUser = {
                    name: document.getElementById('mName').value,
                    username: document.getElementById('mNim').value,
                    password: "123",
                    role: "member",
                    nim: document.getElementById('mNim').value,
                    // Fix: Send null if empty
                    birthDate: document.getElementById('mBirthDate').value || null,
                    phone: document.getElementById('mPhone').value || null,
                    position: document.getElementById('mPos').value,
                    bio: document.getElementById('mBio').value,
                    photo: photo
                };
                try {
                    const response = await fetch(`${API_URL}/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newUser)
                    });
                    if (response.ok) {
                        modal.hide();
                        this.renderMembers(document.getElementById('page-container'));
                    } else {
                        app.showToast("Gagal menambah anggota.", 'danger');
                    }
                } catch (err) {
                    console.error(err);
                    app.showToast("Error adding member.", 'danger');
                }
            };

            if (photoInput.files && photoInput.files[0]) {
                try {
                    const compressed = await app.compressImage(photoInput.files[0]);
                    submitUser(compressed);
                } catch (e) {
                    console.error(e);
                    app.showToast("Gagal memproses gambar.", 'danger');
                }
            } else {
                submitUser(null);
            }
        });
    },

    showEditMemberModal: async function (id) {
        try {
            const res = await fetch(`${API_URL}/users/${id}`);
            const user = await res.json();

            const modalHtml = `
            <div class="modal fade" id="editMemberModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4">
                        <div class="modal-header border-0">
                            <h5 class="modal-title fw-bold">Edit Data Anggota</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editMemberForm">
                                <div class="mb-3">
                                    <label class="small fw-bold">Nama Lengkap</label>
                                    <input type="text" id="eName" class="form-control" value="${user.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">NIM (Username)</label>
                                    <input type="text" id="eNim" class="form-control" value="${user.nim}" required>
                                </div>
                                <div class="row">
                                    <div class="col-6 mb-3">
                                        <label class="small fw-bold">Tanggal Lahir</label>
                                        <input type="date" id="eBirthDate" class="form-control" value="${user.birthDate || ''}">
                                    </div>
                                    <div class="col-6 mb-3">
                                        <label class="small fw-bold">No. HP (WA)</label>
                                        <input type="tel" id="ePhone" class="form-control" placeholder="628xxx" value="${user.phone || ''}">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">Posisi</label>
                                    <select id="ePos" class="form-select">
                                        <option value="Anggota" ${user.position === 'Anggota' ? 'selected' : ''}>Anggota</option>
                                        <option value="Komting" ${user.position === 'Komting' ? 'selected' : ''}>Komting</option>
                                        <option value="Wakil Komting" ${user.position === 'Wakil Komting' ? 'selected' : ''}>Wakil Komting</option>
                                        <option value="Sekretaris" ${user.position === 'Sekretaris' ? 'selected' : ''}>Sekretaris</option>
                                        <option value="Bendahara" ${user.position === 'Bendahara' ? 'selected' : ''}>Bendahara</option>
                                        <option value="Anggota Inti" ${user.position === 'Anggota Inti' ? 'selected' : ''}>Anggota Inti</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-bold">Bio Singkat</label>
                                    <textarea id="eBio" class="form-control" rows="2">${user.bio || ''}</textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 fw-bold py-2">Simpan Perubahan</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;

            document.getElementById('modal-container').innerHTML = modalHtml;
            const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
            modal.show();

            document.getElementById('editMemberForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const updatedUser = {
                    name: document.getElementById('eName').value,
                    nim: document.getElementById('eNim').value,
                    username: document.getElementById('eNim').value,
                    // Fix: Kirim null jika kosong agar tidak error di database DATE column
                    birthDate: document.getElementById('eBirthDate').value || null,
                    phone: document.getElementById('ePhone').value || null,
                    position: document.getElementById('ePos').value,
                    bio: document.getElementById('eBio').value
                };

                try {
                    const response = await fetch(`${API_URL}/users/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedUser)
                    });
                    if (response.ok) {
                        modal.hide();
                        app.showToast("Data anggota berhasil diperbarui", 'success');
                        this.renderMembers(document.getElementById('page-container'));
                    } else {
                        app.showToast("Gagal memperbarui data.", 'danger');
                    }
                } catch (err) {
                    console.error(err);
                    app.showToast("Error updating member.", 'danger');
                }
            });

        } catch (e) {
            console.error(e);
            app.showToast("Gagal memuat data anggota", 'danger');
        }
    },
    renderSchedule: async function (c) {
        const isAdmin = this.currentUser.role === 'superadmin';
        const response = await fetch(`${API_URL}/schedules`);
        const schedules = await response.json();

        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const today = days[new Date().getDay()];

        c.innerHTML = `
            <div class="bento-card">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold mb-0">Jadwal Kuliah</h5>
                    ${isAdmin ? `<button class="btn btn-sm btn-primary" onclick="app.showAddScheduleModal()"><i class="bi bi-plus-lg"></i></button>` : ''}
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Hari</th>
                                <th>Mata Kuliah</th>
                                <th>Jam & Ruang</th>
                                <th>Piket</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schedules.map(s => {
            const isToday = (s.day === today);
            return `
                                    <tr class="${isToday ? 'schedule-today-row' : ''}">
                                        <td><span class="badge ${isToday ? 'schedule-day-badge-today' : 'bg-light text-dark border'}">${s.day}</span></td>
                                        <td class="fw-bold ${isToday ? 'schedule-subject-today' : 'text-body'}">${s.subject}</td>
                                        <td>${s.time}<br><small class="${isToday ? 'schedule-meta-today' : 'text-muted'}">${s.room}</small></td>
                                        <td><span class="small ${isToday ? 'schedule-meta-today' : 'text-muted'}"><i class="bi bi-people me-1"></i>${s.picket}</span></td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    },
    showAddScheduleModal: function () {
        const modalHtml = `
                    <div class="modal fade" id="scheduleModal" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content border-0 rounded-4">
                                <div class="modal-header border-0">
                                    <h5 class="modal-title fw-bold">Tambah Jadwal</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="scheduleForm">
                                        <div class="mb-3">
                                            <label class="small fw-bold">Hari</label>
                                            <select id="sDay" class="form-select">
                                                <option>Senin</option>
                                                <option>Selasa</option>
                                                <option>Rabu</option>
                                                <option>Kamis</option>
                                                <option>Jumat</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Mata Kuliah</label>
                                            <input type="text" id="sSubject" class="form-control" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Jam</label>
                                            <input type="text" id="sTime" class="form-control" placeholder="Contoh: 08:00 - 10:00" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Ruangan</label>
                                            <input type="text" id="sRoom" class="form-control" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Petugas Piket</label>
                                            <input type="text" id="sPicket" class="form-control" placeholder="Nama mahasiswa...">
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100 fw-bold py-2">Simpan Jadwal</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();

        document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newSchedule = {
                day: document.getElementById('sDay').value,
                subject: document.getElementById('sSubject').value,
                time: document.getElementById('sTime').value,
                room: document.getElementById('sRoom').value,
                picket: document.getElementById('sPicket').value
            };

            try {
                const response = await fetch(`${API_URL}/schedules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSchedule)
                });
                if (response.ok) {
                    modal.hide();
                    this.renderSchedule(document.getElementById('page-container'));
                } else {
                    app.showToast("Gagal menambah jadwal.", 'danger');
                }
            } catch (err) {
                console.error(err);
                app.showToast("Error adding schedule.", 'danger');
            }
        });
    },
    renderKas: async function (c) {
        const isAdmin = this.currentUser.role === 'superadmin';
        const [kasRes, expRes, wishRes] = await Promise.all([
            fetch(`${API_URL}/kas`),
            fetch(`${API_URL}/expenses`),
            fetch(`${API_URL}/wishlists`)
        ]);
        const kasAll = await kasRes.json();
        const expenses = await expRes.json();
        const wishlist = await wishRes.json();

        // 1. FILTER DATA: Superadmin sees all, Member sees only their own
        const kas = isAdmin ? kasAll : kasAll.filter(k => k.id === this.currentUser.id);

        // Default to current year or 2024
        if (!this.selectedKasYear) this.selectedKasYear = new Date().getFullYear().toString();
        // Ensure selected year is within range
        if (parseInt(this.selectedKasYear) < 2024) this.selectedKasYear = "2024";
        if (parseInt(this.selectedKasYear) > 2028) this.selectedKasYear = "2028";

        const MONTHLY_FEE = 10000;
        const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

        // Calculate Totals 
        let totalCollected = 0;
        // Total collected is calculated based on ALL users data (kasAll) to be accurate for "Sisa Saldo Kelas"
        kasAll.forEach(k => {
            if (k.months) {
                Object.values(k.months).forEach(yearMonths => {
                    if (Array.isArray(yearMonths)) {
                        totalCollected += yearMonths.filter(m => m).length * MONTHLY_FEE;
                    }
                });
            }
        });
        
        // For "Total Kas Saya", use 'kas' (which is filtered) if not admin
        let myTotal = 0;
        if(!isAdmin && kas.length > 0) {
             if (kas[0].months) {
                Object.values(kas[0].months).forEach(yearMonths => {
                    if (Array.isArray(yearMonths)) {
                        myTotal += yearMonths.filter(m => m).length * MONTHLY_FEE;
                    }
                });
            }
        } else {
            myTotal = totalCollected; // Admin sees total
        }

        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = totalCollected - totalSpent;

        const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
        
        // Leaderboard Logic
        const fullLeaderboard = kasAll.map(k => {
            let score = 0;
            if (k.months) {
                Object.values(k.months).forEach(ym => { if(Array.isArray(ym)) score += ym.filter(m=>m).length; });
            }
            return { id: k.id, name: k.name, score: score }; 
        })
        .filter(u => u.score > 0)
        .sort((a,b) => b.score - a.score);

        const top3 = fullLeaderboard.slice(0, 3);
        const nextRanks = fullLeaderboard.slice(3);

        c.innerHTML = `
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="bento-card bg-success text-white border-0">
                        <h6 class="opacity-75">${isAdmin ? 'Total Pemasukan Kas' : 'Total Kas Saya'}</h6>
                        <h3 class="fw-bold">${formatRupiah(myTotal)}</h3>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="bento-card bg-danger text-white border-0">
                        <h6 class="opacity-75">Total Pengeluaran</h6>
                        <h3 class="fw-bold">${formatRupiah(totalSpent)}</h3>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="bento-card bg-primary text-white border-0">
                        <h6 class="opacity-75">Sisa Saldo Kelas</h6>
                        <h3 class="fw-bold">${isAdmin ? formatRupiah(remaining) : '***'}</h3>
                    </div>
                </div>
            </div>

            <div class="bento-card mb-4 bg-warning-subtle border-0">
                 <div class="d-flex align-items-center justify-content-between mb-3">
                    <h5 class="fw-bold mb-0">👑 Top 3 Rajin Bayar</h5>
                 </div>
                 <div class="row row-cols-1 row-cols-md-3 g-3 justify-content-center">
                    ${top3.map((u, i) => `
                        <div class="col">
                             <div class="bg-white p-3 rounded-4 shadow-sm text-center h-100 border border-warning border-opacity-25 scale-hover" style="transition: transform 0.2s;">
                                <div class="mb-2 position-relative d-inline-block">
                                    ${i === 0 ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning border border-light shadow-sm" style="font-size: 1.2rem;">🥇</span>' : 
                                      i === 1 ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary border border-light shadow-sm" style="font-size: 1rem;">🥈</span>' : 
                                                '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light shadow-sm" style="font-size: 1rem;">🥉</span>'}
                                    <img src="${API_URL}/users/${u.id}/photo" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${u.name}&background=random'" class="rounded-circle border border-3 border-warning shadow-sm" style="width: 70px; height: 70px; object-fit: cover;">
                                </div>
                                <div class="fw-bold text-dark text-truncate mb-1 mt-2">${u.name}</div>
                                <div class="fw-bold text-primary bg-primary-subtle rounded-pill px-3 py-1 small d-inline-block">${u.score} Bulan</div>
                             </div>
                        </div>
                    `).join('')}
                    ${top3.length === 0 ? '<div class="col-12 text-center text-muted py-3">Belum ada yang bayar kas. Ayo jadi yang pertama!</div>' : ''}
                 </div>
            </div>

            ${nextRanks.length > 0 ? `
            <div class="bento-card mb-4">
                <h5 class="fw-bold mb-3 text-secondary">🎖️ Peringkat 4 - 55</h5>
                <div class="table-responsive custom-scrollbar" style="max-height: 400px;">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light sticky-top">
                            <tr>
                                <th class="text-center" style="width: 50px;">#</th>
                                <th style="width: 60px;">Foto</th>
                                <th>Nama</th>
                                <th class="text-end">Skor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${nextRanks.map((u, i) => `
                                <tr>
                                    <td class="text-center fw-bold text-muted">${i + 4}</td>
                                    <td>
                                        <img src="${API_URL}/users/${u.id}/photo" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${u.name}&background=random&size=40'" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">
                                    </td>
                                    <td class="fw-bold text-dark text-truncate" style="max-width: 150px;">${u.name}</td>
                                    <td class="text-end"><span class="badge bg-secondary-subtle text-dark rounded-pill">${u.score} Bulan</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>` : ''}

            <div class="bento-card mb-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold mb-0">Laporan Kas</h5>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-primary text-white fw-bold" onclick="app.showPaymentModal()"><i class="bi bi-qr-code-scan"></i> Bayar Kas</button>
                        <select class="form-select form-select-sm" style="width: auto;" onchange="app.selectedKasYear = this.value; app.renderKas(document.getElementById('page-container'))">
                            ${[2024, 2025, 2026, 2027, 2028].map(y => `<option value="${y}" ${y == this.selectedKasYear ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table align-middle text-center table-hover table-sm" style="font-size: 0.9rem;">
                        <thead>
                            <tr>
                                <th class="text-start">Nama</th>
                                ${monthsList.map(m => `<th>${m}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${kas.map(k => {
                                const yearData = k.months && k.months[this.selectedKasYear] ? k.months[this.selectedKasYear] : Array(12).fill(false);
                                return `<tr>
                                    <td class="text-start fw-bold text-nowrap text-capitalize">${k.name.toLowerCase()}</td>
                                    ${yearData.map((p, i) => `<td><div onclick="app.toggleKas(${k.id}, '${this.selectedKasYear}', ${i})" class="${isAdmin ? 'cursor-pointer' : ''}">${p ? '<i class="bi bi-check-circle-fill text-success"></i>' : '<i class="bi bi-circle text-muted opacity-25"></i>'}</div></td>`).join('')}
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    ${!isAdmin && kas.length === 0 ? '<div class="text-center text-muted p-3">Data kas tidak ditemukan. Hubungi admin.</div>' : ''}
                </div>
            </div>

            <div class="row g-4">
                <div class="col-lg-6">
                     <div class="bento-card h-100">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="fw-bold mb-0">Riwayat Pengeluaran</h5>
                            ${isAdmin ? `<button class="btn btn-sm btn-danger fw-bold" onclick="app.showAddExpenseModal()"><i class="bi bi-plus-lg me-1"></i> Catat Pengeluaran</button>` : ''}
                        </div>
                         <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Keterangan</th>
                                        <th class="text-end">Jumlah</th>
                                        ${isAdmin ? '<th></th>' : ''}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${expenses.length > 0 ? expenses.map(e => `
                                        <tr>
                                            <td>${e.date}</td>
                                            <td>${e.title}</td>
                                            <td class="text-end fw-bold text-danger">-${formatRupiah(e.amount)}</td>
                                            ${isAdmin ? `<td class="text-end"><button class="btn btn-sm btn-link text-danger p-0" onclick="app.deleteExpense(${e.id})"><i class="bi bi-trash"></i></button></td>` : ''}
                                        </tr>`).join('') : '<tr><td colspan="4" class="text-center text-muted">Belum ada pengeluaran.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
                <div class="col-lg-6">
                    <div class="bento-card h-100">
                         <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 class="fw-bold mb-0">🧞‍♂️ Wishlist Kelas</h5>
                                <small class="text-muted">Mau beli apa pakai uang kas?</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary fw-bold" onclick="app.showAddWishlistModal()">+ Request</button>
                        </div>
                         <div class="d-flex flex-column gap-3">
                            ${wishlist.length > 0 ? wishlist.map(w => `
                                <div class="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="fw-bold mb-1">${w.item_name}</h6>
                                        <div class="small text-muted mb-2">Estimasi: ${formatRupiah(w.estimated_price)} • by ${w.requester_name}</div>
                                        <div class="progress" style="height: 6px; width: 100px;">
                                            <div class="progress-bar bg-success" style="width: ${Math.min((w.votes / 25) * 100, 100)}%"></div>
                                        </div>
                                        <small class="text-success fw-bold" style="font-size: 0.7rem;">${w.votes} Votes</small>
                                    </div>
                                    <div class="d-flex flex-column gap-2">
                                         <button class="btn btn-sm btn-light border shadow-sm text-success" onclick="app.voteWishlist(${w.id})"><i class="bi bi-arrow-up-circle-fill"></i> Vote</button>
                                         ${isAdmin ? `<button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="app.deleteWishlist(${w.id})"><i class="bi bi-trash"></i></button>` : ''}
                                    </div>
                                </div>
                            `).join('') : '<div class="text-center text-muted py-4">Belum ada wishlist.</div>'}
                         </div>
                    </div>
                </div>
            </div>
        `;
    },

    showAddWishlistModal: function() {
        const modalHtml = `
            <div class="modal fade" id="wishModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bento-card border-0">
                        <div class="modal-header border-0"><h5 class="modal-title fw-bold">Request Barang</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
                        <div class="modal-body">
                            <form id="wishForm">
                                <div class="mb-3"><label class="small fw-bold">Nama Barang</label><input type="text" id="wName" class="form-control" required></div>
                                <div class="mb-3"><label class="small fw-bold">Estimasi Harga</label><input type="number" id="wPrice" class="form-control" required></div>
                                <button type="submit" class="btn btn-primary w-100 rounded-pill fw-bold py-2">Submit Request</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('wishModal'));
        modal.show();
        
        document.getElementById('wishForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await fetch(`${API_URL}/wishlists`, {
                method: 'POST',
                headers: {'content-type':'application/json'},
                body: JSON.stringify({
                    item_name: document.getElementById('wName').value,
                    estimated_price: document.getElementById('wPrice').value,
                    requester_name: this.currentUser.name
                })
            });
            modal.hide(); document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            this.renderKas(document.getElementById('page-container'));
        });
    },

    voteWishlist: async function(id) {
        await fetch(`${API_URL}/wishlists/${id}/vote`, { method:'POST' });
        this.renderKas(document.getElementById('page-container'));
    },
    
    deleteWishlist: async function(id) {
        if(confirm('Hapus item ini?')) {
            await fetch(`${API_URL}/wishlists/${id}`, { method:'DELETE' });
            this.renderKas(document.getElementById('page-container'));
        }
    },
    showPaymentModal: function () {
        const modalId = 'paymentModal';
        let modalEl = document.getElementById(modalId);

        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.className = 'modal fade';
            modalEl.id = modalId;
            modalEl.tabIndex = -1;
            modalEl.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bento-card border-0">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fw-bold">Pembayaran Kas</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center pt-4">
                            <div class="mb-4">
                                <h6 class="text-muted mb-3">Scan QRIS Untuk Membayar</h6>
                                <div class="bg-light rounded p-3 d-inline-block border" style="min-width: 250px; min-height: 250px; display: flex; align-items: center; justify-content: center;">
                                    
                                     <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" class="img-fluid" alt="QRIS Code" style="max-height: 250px;"> 
                                </div>
                                <p class="small text-muted mt-2">Nominal: Rp 10.000 / Bulan</p>
                            </div>
                            <div class="alert alert-info border-0 d-flex align-items-center mb-0 text-start" role="alert">
                                <i class="bi bi-info-circle-fill me-2 fs-4"></i>
                                <div class="small">
                                    Setelah transfer, harap konfirmasi ke Bendahara dengan bukti transfer.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0 pt-0 justify-content-center">
                            <button type="button" class="btn btn-primary rounded-pill px-5" data-bs-dismiss="modal">Mengerti</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalEl);
        }

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    },

    toggleKas: async function (userId, year, monthIndex) {
        if (this.currentUser.role !== 'superadmin') return;

        const response = await fetch(`${API_URL}/kas`);
        const allKas = await response.json();
        const record = allKas.find(k => k.id === userId);

        if (record) {
            if (!record.months[year]) record.months[year] = Array(12).fill(false);
            record.months[year][monthIndex] = !record.months[year][monthIndex];

            await fetch(`${API_URL}/kas/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ months: record.months })
            });
            this.showToast('Status kas berhasil diperbarui', 'success');
            this.renderKas(document.getElementById('page-container'));
        }
    },
    showAddExpenseModal: function () {
        const modalHtml = `
                    <div class="modal fade" id="expenseModal" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content border-0 rounded-4">
                                <div class="modal-header border-0">
                                    <h5 class="modal-title fw-bold">Catat Pengeluaran</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="expenseForm">
                                        <div class="mb-3">
                                            <label class="small fw-bold">Judul Pengeluaran</label>
                                            <input type="text" id="exTitle" class="form-control" required placeholder="Contoh: Beli Spidol">
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Jumlah (Rp)</label>
                                            <input type="number" id="exAmount" class="form-control" required placeholder="15000">
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Tanggal</label>
                                            <input type="date" id="exDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                                        </div>
                                        <div class="mb-3">
                                            <label class="small fw-bold">Keterangan Tambahan</label>
                                            <textarea id="exDesc" class="form-control" rows="2"></textarea>
                                        </div>
                                        <button type="submit" class="btn btn-danger w-100 fw-bold py-2">Simpan Pengeluaran</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('expenseModal'));
        modal.show();

        document.getElementById('expenseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                title: document.getElementById('exTitle').value,
                amount: parseInt(document.getElementById('exAmount').value),
                date: document.getElementById('exDate').value,
                description: document.getElementById('exDesc').value
            };

            try {
                const res = await fetch(`${API_URL}/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    modal.hide();
                    this.renderKas(document.getElementById('page-container'));
                } else {
                    app.showToast("Gagal menyimpan.", 'danger');
                }
            } catch (err) { console.error(err); app.showToast("Error.", 'danger'); }
        });
    },

    deleteExpense: async function (id) {
        if (!confirm("Hapus data pengeluaran ini?")) return;
        try {
            const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
            if (res.ok) this.renderKas(document.getElementById('page-container'));
        } catch (err) { console.error(err); }
    },
    showProfile: async function (userId) {
        const response = await fetch(`${API_URL}/users/${userId}`);
        const user = await response.json();
        if (!user) return;

        const fallbackAvatar = `<div class='bg-primary bg-gradient text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow' style='width: 120px; height: 120px; font-size: 3rem;'>${user.name.charAt(0)}</div>`;

        // Wrap photo in a specific container with zoom capability
        const photoHtml = user.hasPhoto
            ? `<div class="mb-4 d-flex justify-content-center position-relative">
                    <div class="avatar-skeleton skeleton position-absolute top-0 z-2" style="width: 120px; height: 120px; border-radius: 50%;"></div>
                    <img src="${API_URL}/users/${userId}/photo" class="avatar-circle shadow-lg position-relative z-1 profile-zoom" 
                        style="width: 120px; height: 120px; object-fit: cover; cursor: zoom-in; transition: transform 0.3s;" 
                        onclick="app.viewFullPhoto('${API_URL}/users/${userId}/photo', '${user.name}')"
                        onload="this.previousElementSibling.style.display='none'"
                        onerror="this.parentElement.innerHTML=\`${fallbackAvatar}\`">
               </div>`
            : `<div class="mb-4 d-flex justify-content-center">${fallbackAvatar}</div>`;

        const modalHtml = `
            <div class="modal fade" id="profileModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
                        
                        <!-- Header Background -->
                        <div class="position-relative bg-primary bg-gradient" style="height: 100px;">
                            <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3 z-3" data-bs-dismiss="modal"></button>
                            <div class="position-absolute bottom-0 start-0 w-100 h-50 bg-white" style="border-radius: 50% 50% 0 0 / 100% 100% 0 0; margin-bottom: -1px;"></div>
                        </div>

                        <div class="modal-body text-center px-4 pb-5 pt-0 position-relative">
                            
                            <!-- Negative margin to pull avatar up -->
                            <div style="margin-top: -60px;">
                                ${photoHtml}
                            </div>
                            
                            <h3 class="fw-bold mb-1 text-dark" style="letter-spacing: -0.5px;">${user.name}</h3>
                            <div class="mb-4">
                                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 1px;">
                                    ${user.position}
                                </span>
                            </div>

                            <div class="row g-3 text-start">
                                <div class="col-12">
                                    <div class="p-3 rounded-4 bg-light bg-opacity-50 border h-100">
                                        <div class="d-flex align-items-center mb-2">
                                            <div class="bg-white p-2 rounded-circle shadow-sm me-3 text-primary">
                                                <i class="bi bi-person-vcard fs-5"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted fw-bold d-block text-uppercase" style="font-size: 0.7rem;">NIM / ID</small>
                                                <span class="fw-bold text-dark fs-5 user-select-all font-monospace">${user.nim}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="p-3 rounded-4 bg-light bg-opacity-50 border h-100">
                                        <div class="d-flex align-items-start mb-2">
                                            <div class="bg-white p-2 rounded-circle shadow-sm me-3 text-success">
                                                <i class="bi bi-quote fs-5"></i>
                                            </div>
                                            <div>
                                                <small class="text-muted fw-bold d-block text-uppercase" style="font-size: 0.7rem;">Bio / Status</small>
                                                <div class="text-secondary fst-italic mt-1" style="line-height: 1.6;">
                                                    "${user.bio || 'Tidak ada bio.'}"
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        new bootstrap.Modal(document.getElementById('profileModal')).show();
    },

    viewFullPhoto: function (src, name) {
        // Create a new modal on top of existing one for full photo view
        const zoomModalHtml = `
            <div class="modal fade" id="photoZoomModal" tabindex="-1" style="z-index: 1060;">
                <div class="modal-dialog modal-fullscreen modal-dialog-centered">
                    <div class="modal-content bg-transparent border-0 shadow-none" style="background-color: rgba(0,0,0,0.95) !important;">
                        <div class="modal-body text-center position-relative p-0 d-flex flex-column align-items-center justify-content-center h-100 w-100">
                             <button type="button" class="position-absolute top-0 end-0 m-4 z-3 btn btn-dark rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg border border-white border-opacity-25" style="width: 56px; height: 56px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" data-bs-dismiss="modal">
                                <i class="bi bi-x-lg text-white fs-4"></i>
                            </button>
                            <div class="d-flex align-items-center justify-content-center w-100 h-100 p-2">
                                <img src="${src}" class="shadow-lg" style="width: 100%; height: 100%; max-height: 85vh; object-fit: contain; animation: zoomIn 0.3s ease;">
                            </div>
                            <div class="mb-4 text-white fw-bold text-shadow fs-4 position-absolute bottom-0 pb-3 w-100">${name}</div>
                        </div>
                    </div>
                </div>
            </div>`;

        // Append to body instead of replacing distinct container to allow stacking
        const div = document.createElement('div');
        div.innerHTML = zoomModalHtml;
        document.body.appendChild(div);

        const zoomModalEl = document.getElementById('photoZoomModal');
        const zoomModal = new bootstrap.Modal(zoomModalEl);

        zoomModalEl.addEventListener('hidden.bs.modal', function () {
            zoomModalEl.remove(); // Cleanup DOM after close
        });

        zoomModal.show();
    },
    handlePermission: async function (id, status) {
        await fetch(`${API_URL}/permissions/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        this.renderRequests(document.getElementById('page-container'));
    },
    renderComplaints: async function (c) {
        const [complaintsRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/complaints`),
            fetch(`${API_URL}/users`) // Now lightweight (no photo content)
        ]);
        const complaints = await complaintsRes.json();
        const users = await usersRes.json();

        // Map user Name -> ID + hasPhoto flag
        const userMap = {};
        users.forEach(u => userMap[u.name] = { id: u.id, hasPhoto: u.hasPhoto });

        c.innerHTML = `<div class="row g-4"><div class="col-md-4"><div class="bento-card"><h5 class="fw-bold mb-3">Tulis Keluhan</h5><textarea id="complaintText" class="form-control mb-2" rows="4" placeholder="Ketik keluhan Anda..."></textarea><div class="form-check mb-3"><input id="complaintAnon" class="form-check-input" type="checkbox"><label class="form-check-label small">Kirim sebagai Anonim</label></div><button class="btn btn-primary w-100 fw-bold" onclick="app.submitComplaint()">Kirim</button></div></div><div class="col-md-8"><div class="d-flex flex-column gap-3">${complaints.map(co => {
            const userData = userMap[co.sender]; // { id, hasPhoto }

            // If sender exists and hasPhoto is true (1), use the lazy loading URL. 
            // If hasPhoto is 0, we can skip the request or use default.
            // Note: If userData is undefined (e.g. user deleted), show default.

            const avatarHtml = (userData && userData.hasPhoto && !co.isAnon)
                ? `<img src="${API_URL}/users/${userData.id}/photo" class="rounded-circle me-2 shadow-sm" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/40'">`
                : `<div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2 shadow-sm" style="width: 40px; height: 40px; min-width: 40px; font-weight: bold;">${co.isAnon || !co.sender ? '?' : co.sender.charAt(0)}</div>`;

            return `<div class="bento-card p-3"><div class="d-flex align-items-center mb-2">${avatarHtml}<strong>${co.isAnon ? 'Anonim' : co.sender}</strong></div><p class="mb-0 text-secondary">${co.text}</p></div>`;
        }).join('')}</div></div></div>`;
    },
    submitComplaint: async function () {
        const text = document.getElementById('complaintText').value;
        const isAnon = document.getElementById('complaintAnon').checked;
        if (!text) return;

        await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                isAnon: isAnon,
                sender: isAnon ? 'Anonim' : (this.currentUser ? this.currentUser.name : 'Unknown')
            })
        });
        app.showToast('Terkirim!', 'success');
        this.renderComplaints(document.getElementById('page-container'));
    },
    renderAbout: function (c) { c.innerHTML = `<div class="text-center py-5"><h1>IF B SR</h1><p>Website Kelas</p></div>`; },
    render404: function (c) {
        c.innerHTML = `
            <div class="error-page-container fade-in">
                <div class="error-card">
                    <div class="position-absolute top-0 start-0 p-4 opacity-50">
                        <i class="bi bi-bug-fill fs-3 text-muted"></i>
                    </div>
                    <div class="position-absolute bottom-0 end-0 p-4 opacity-50">
                        <i class="bi bi-code-slash fs-3 text-muted"></i>
                    </div>
                    
                    <div class="mb-4 position-relative d-inline-block">
                        <div class="error-glitch text-primary" data-text="404">404</div>
                        <i class="bi bi-robot floating-icon fs-1 text-warning position-absolute top-0 end-0 translate-middle-y"></i>
                    </div>

                    <h3 class="fw-bold mb-3">System Malfunction</h3>
                    <p class="text-muted mb-4">
                        Maaf, halaman yang Anda cari telah hilang ditelan <i>infinite loop</i> atau mungkin memang tidak pernah ada.
                    </p>

                    <div class="code-box mb-4 shadow-sm border">
                        <span class="text-danger">Error:</span> PageNotFoundException<br>
                        <span class="text-primary">at</span> RouteHandler (app.js:404)<br>
                        <span class="text-success">> Try:</span> Returning to safe zone...
                    </div>

                    <div class="d-flex gap-3 justify-content-center">
                        <button class="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" onclick="app.router('dashboard')">
                            <i class="bi bi-house-fill me-2"></i> Dashboard
                        </button>
                        <button class="btn btn-light border rounded-pill px-4 py-2 fw-bold" onclick="history.back()">
                            <i class="bi bi-arrow-left me-2"></i> Kembali
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    renderAdmin: async function (c) {
        const [usersRes, kasRes, expRes, complaintsRes, permissionsRes, announcementsRes] = await Promise.all([
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/kas`),
            fetch(`${API_URL}/expenses`),
            fetch(`${API_URL}/complaints`),
            fetch(`${API_URL}/permissions`),
            fetch(`${API_URL}/announcements`)
        ]);

        const users = await usersRes.json();
        const kas = await kasRes.json();
        const expenses = await expRes.json();
        const complaints = await complaintsRes.json();
        const permissions = await permissionsRes.json();
        const announcements = await announcementsRes.json();

        // Calculate Kas
        const MONTHLY_FEE = 10000;
        let totalCollected = 0;
        kas.forEach(k => {
            if (k.months) {
                Object.values(k.months).forEach(yearMonths => {
                    if (Array.isArray(yearMonths)) {
                        totalCollected += yearMonths.filter(m => m).length * MONTHLY_FEE;
                    }
                });
            }
        });
        const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const saldo = totalCollected - totalSpent;
        const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

        c.innerHTML = `
                    <h4 class="fw-bold mb-4">Admin Dashboard</h4>
                    <div class="row g-4 mb-4">
                        <div class="col-md-3">
                            <div class="bento-card bg-primary text-white border-0">
                                <h6 class="opacity-75">Total Anggota</h6>
                                <h3 class="fw-bold">${users.length}</h3>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="bento-card bg-success text-white border-0">
                                <h6 class="opacity-75">Saldo Kas</h6>
                                <h3 class="fw-bold text-truncate" title="${formatRupiah(saldo)}">${formatRupiah(saldo)}</h3>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="bento-card bg-warning text-white border-0">
                                <h6 class="opacity-75">Izin Pending</h6>
                                <h3 class="fw-bold">${permissions.filter(p => p.status === 'pending').length}</h3>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="bento-card bg-info text-white border-0">
                                <h6 class="opacity-75">Total Keluhan</h6>
                                <h3 class="fw-bold">${complaints.length}</h3>
                            </div>
                        </div>
                    </div>

                    <div class="row g-4">
                        <div class="col-md-8">
                            <div class="bento-card h-100">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="fw-bold mb-0">Pengumuman Aktif</h5>
                                    <button class="btn btn-primary btn-sm rounded-pill px-3" onclick="app.showAddAnnouncementModal()">+ Buat Baru</button>
                                </div>
                                <div class="d-flex flex-column gap-3">
                                    ${announcements.length ? announcements.map(a => `
                                        <div class="p-3 rounded-3 bg-light border-start border-4 border-${a.color || 'primary'}">
                                            <div class="d-flex justify-content-between align-items-start mb-1">
                                                <strong class="text-main">${a.title}</strong>
                                                <div class="d-flex align-items-center gap-2">
                                                    <span class="badge bg-white text-muted border">${a.date}</span>
                                                    <button class="btn btn-link text-danger p-0" onclick="app.deleteAnnouncement(${a.id})"><i class="bi bi-trash"></i></button>
                                                </div>
                                            </div>
                                            <p class="mb-0 text-muted small">${a.content}</p>
                                        </div>
                                    `).join('') : '<p class="text-muted text-center py-3">Belum ada pengumuman.</p>'}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="bento-card h-100">
                                <h5 class="fw-bold mb-3">Aksi Cepat</h5>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary text-start p-3 rounded-3" onclick="app.showAddMemberModal()">
                                        <i class="bi bi-person-plus-fill me-2"></i> Tambah Anggota
                                    </button>
                                    <button class="btn btn-success text-start p-3 rounded-3" onclick="app.router('kas')">
                                        <i class="bi bi-wallet2 me-2"></i> Kelola Keuangan
                                    </button>
                                    <button class="btn btn-warning text-start text-light p-3 rounded-3" onclick="app.router('jadwal')">
                                        <i class="bi bi-calendar-event me-2"></i> Atur Jadwal
                                    </button>
                                    <button class="btn btn-info text-start text-light p-3 rounded-3" onclick="app.router('Izin-sakit')">
                                        <i class="bi bi-envelope-check-fill me-2"></i> Cek Perizinan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    },
    showAddAnnouncementModal: function () {
        const modalHtml = `
                    <div class="modal fade" id="announcementModal" tabindex="-1">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content border-0 rounded-4 shadow-lg">
                                <div class="modal-header border-0">
                                    <h5 class="modal-title fw-bold">Buat Pengumuman</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <form id="announcementForm">
                                        <div class="mb-3">
                                            <label class="form-label small fw-bold text-muted">Judul</label>
                                            <input type="text" id="annTitle" class="form-control rounded-3" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label small fw-bold text-muted">Isi Pengumuman</label>
                                            <textarea id="annContent" class="form-control rounded-3" rows="3" required></textarea>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label small fw-bold text-muted">Warna Label</label>
                                            <select id="annColor" class="form-select rounded-3">
                                                <option value="primary">Biru (Info)</option>
                                                <option value="danger">Merah (Penting)</option>
                                                <option value="warning">Kuning (Peringatan)</option>
                                                <option value="success">Hijau (Sukses)</option>
                                            </select>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100 rounded-pill fw-bold">Posting</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>`;
        document.getElementById('modal-container').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('announcementModal'));
        modal.show();

        document.getElementById('announcementForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                title: document.getElementById('annTitle').value,
                content: document.getElementById('annContent').value,
                color: document.getElementById('annColor').value,
                date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            };

            try {
                const res = await fetch(`${API_URL}/announcements`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    modal.hide();
                    this.renderAdmin(document.getElementById('page-container'));
                } else {
                    app.showToast("Gagal memposting.", 'danger');
                }
            } catch (err) { console.error(err); app.showToast("Error.", 'danger'); }
        });
    },
    deleteAnnouncement: async function (id) {
        if (!confirm("Hapus pengumuman ini?")) return;
        try {
            const res = await fetch(`${API_URL}/announcements/${id}`, { method: 'DELETE' });
            if (res.ok) this.renderAdmin(document.getElementById('page-container'));
        } catch (e) { console.error(e); }
    },
    renderSidebar: function () {
        const r = this.currentUser.role;
        let html = `<li><a href="/dashboard" onclick="event.preventDefault(); app.router('dashboard')" id="nav-dashboard" class="nav-link"><i class="bi bi-grid-1x2-fill me-2"></i> Dashboard</a></li><li><a href="/jadwal" onclick="event.preventDefault(); app.router('jadwal')" id="nav-jadwal" class="nav-link"><i class="bi bi-calendar-event me-2"></i> Jadwal</a></li>`;
        if (r !== 'viewer') html += `<li><a href="/kas" onclick="event.preventDefault(); app.router('kas')" id="nav-kas" class="nav-link"><i class="bi bi-wallet2 me-2"></i> Kas</a></li>`;
        html += `<li><a href="/gallery" onclick="event.preventDefault(); app.router('gallery')" id="nav-gallery" class="nav-link"><i class="bi bi-images me-2"></i> Galeri</a></li><li><a href="/anggota" onclick="event.preventDefault(); app.router('anggota')" id="nav-anggota" class="nav-link"><i class="bi bi-people-fill me-2"></i> Anggota</a></li>`;
        if (r !== 'viewer') html += `<li><a href="/Izin-sakit" onclick="event.preventDefault(); app.router('Izin-sakit')" id="nav-Izin-sakit" class="nav-link"><i class="bi bi-envelope-paper-heart me-2"></i> Izin</a></li><li><a href="/keluhan" onclick="event.preventDefault(); app.router('keluhan')" id="nav-keluhan" class="nav-link"><i class="bi bi-chat-quote-fill me-2"></i> Keluhan</a></li>`;
        if (r === 'superadmin') html += `<li class="mt-3 text-uppercase text-secondary px-3 small fw-bold" style="font-size: 0.7rem; letter-spacing: 1px;">Admin Control</li><li><a href="/admin" onclick="event.preventDefault(); app.router('admin')" id="nav-admin" class="nav-link text-warning"><i class="bi bi-shield-check me-2"></i> Panel</a></li>`;
        html += `<li><a href="/about" onclick="event.preventDefault(); app.router('about')" id="nav-about" class="nav-link"><i class="bi bi-info-circle-fill me-2"></i> Info</a></li>`;
        document.getElementById('sidebar-menu').innerHTML = html;
    }
};


/* --- FITUR NOTIFIKASI PERANGKAT (WEB PUSH) --- */
const publicVapidKey = 'BIoovBAZ4h6Ow6jvi-sir3yomkMcrPeftPIqI69oZ4M1QNrVUdHj15gyEXEOglq8jZnQs9-v56G4L0U00qRD6Lw';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const register = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker Registered...');

      if (Notification.permission === 'default') {
          console.log("Meminta izin notifikasi...");
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              subscribeUser(register);
          }
      } else if (Notification.permission === 'granted') {
          subscribeUser(register);
      }
    } catch (err) {
      console.error('Service Worker Gagal:', err);
    }
  }
}

async function subscribeUser(register) {
    try {
        const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // UPDATE: Gunakan port 3000 sesuai backend yang aktif
        const API_BASE = 'http://localhost:3000'; 
        
        const response = await fetch(`${API_BASE}/api/notifications/subscribe`, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'content-type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        console.log('✅ Device berhasil subscribe notifikasi! (Disimpan di Server)');
    } catch (e) {
        console.error("❌ Gagal subscribe user: ", e);
    }
}

// Jalankan saat load dengan interaksi user agar tidak diblokir
async function initNotificationPrompt() {
    // Register SW dulu tanpa minta izin
    const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    // Cek status izin saat ini
    if (Notification.permission === 'default') {
        const mauNotif = confirm("Mau aktifkan notifikasi langsung di HP/Laptop untuk pengumuman kelas?");
        if (mauNotif) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                subscribeUser(register);
            }
        }
    } else if (Notification.permission === 'granted') {
        // Jika sudah diizinkan sebelumnya, update subscription
        subscribeUser(register);
    }
}

// Jalankan prompt
if ('serviceWorker' in navigator) {
    setTimeout(initNotificationPrompt, 2000);
}

document.addEventListener('DOMContentLoaded', () => app.init());

