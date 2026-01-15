const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// Generate default structure for 2024-2028
const getDefaultKasData = () => {
    const data = {};
    for (let year = 2024; year <= 2028; year++) {
        data[year] = Array(12).fill(false);
    }
    return data;
};

const Kas = sequelize.define('Kas', {
    months: {
        type: DataTypes.JSON,
        defaultValue: getDefaultKasData()
    }
});

Kas.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Kas, { foreignKey: 'userId' });

module.exports = Kas;
