const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    date: {
        type: DataTypes.STRING, // Or DATEONLY
        allowNull: false
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: 'primary'
    }
});

module.exports = Announcement;
