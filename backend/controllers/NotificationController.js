const Subscription = require('../models/Subscription');

exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        
        // Cek validitas data
        if (!subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ msg: 'Invalid subscription object' });
        }

        // Cari apakah endpoint sudah ada, kalau belum simpan
        // Kita simpan keys sebagai JSON string
        const keysString = JSON.stringify(subscription.keys);
        
        const [sub, created] = await Subscription.findOrCreate({
            where: { endpoint: subscription.endpoint }, // Endpoint harus unik
            defaults: {
                endpoint: subscription.endpoint,
                keys: keysString
            }
        });

        if (!created) {
            // Jika sudah ada, update keys-nya (siapa tahu berubah)
            sub.keys = keysString;
            await sub.save();
        }

        res.status(201).json({ msg: 'Subscription saved successfully' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ msg: 'Failed to save subscription' });
    }
};
