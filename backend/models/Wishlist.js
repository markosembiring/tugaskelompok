const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
    item_name: { type: DataTypes.STRING, allowNull: false },
    price_estimate: { type: DataTypes.INTEGER, defaultValue: 0 },
    votes: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = Wishlist;
