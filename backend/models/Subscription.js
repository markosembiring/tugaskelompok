const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
    endpoint: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    keys: {
        type: DataTypes.TEXT, // Will store stringified JSON { p256dh: '...', auth: '...' }
        allowNull: false
    }
});

module.exports = Subscription;
