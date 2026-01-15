const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gallery = sequelize.define('Gallery', {
    url: {
        type: DataTypes.TEXT('long'), // Base64 or URL
        allowNull: false
    },
    desc: {
        type: DataTypes.STRING,
        allowNull: true
    },
    uploader: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.NOW
    },
    category: {
        type: DataTypes.STRING, // 'general', 'fame', 'shame'
        defaultValue: 'general'
    }
});

module.exports = Gallery;
