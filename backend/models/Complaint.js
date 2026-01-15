const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Complaint = sequelize.define('Complaint', {
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isAnon: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: true // Can be null if anon, but frontend sends "Anonim" or name
    },
    replies: {
        type: DataTypes.JSON,
        defaultValue: []
    }
});

module.exports = Complaint;
