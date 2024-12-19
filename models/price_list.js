'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class price_list extends Model {
        static associate(models) {
            price_list.belongsTo(models.user, { foreignKey: 'user_id' });
        }
    };
    price_list.init({
        user_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        description: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'price_list',
    });
    return price_list;
};