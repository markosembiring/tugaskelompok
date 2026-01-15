// Service Worker untuk Push Notification (Portal Kelas)
self.addEventListener('push', function(event) {
    const data = event.data.json();
    console.log('Push Received...', data);
    
    const title = data.title || "Notifikasi Portal Kelas";
    const options = {
      body: data.body || "Ada pengumuman baru!",
      icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/10309/10309289.png', // Default 3D Bell
      badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png', // Small icon for header
      vibrate: [200, 100, 200], // Getar: Bzz-diam-Bzz
      requireInteraction: true, // Notifikasinya nunggu diclose user, ga ilang sendiri
      actions: data.actions || [
        { action: 'open_url', title: 'Buka Portal' }
      ],
      data: {
          url: data.url || '/'
      }
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    // Jika user klik tombol "Tutup" atau action close lainnya
    if (event.action === 'close' || event.action === 'cancel') {
        return;
    }
    
    // Default action: Buka URL
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  });
