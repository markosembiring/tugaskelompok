const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'member'
    },
    nim: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING,
        defaultValue: 'Anggota'
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true // For WhatsApp Notification
    },
    photo: {
        type: DataTypes.TEXT('long'), // Using TEXT for base64 or URL
        allowNull: true
    }
});

module.exports = User;
