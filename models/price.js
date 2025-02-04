'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class price extends Model {
        static associate(models) {
            price.belongsTo(models.variant, { foreignKey: 'variant_id' });
            price.belongsTo(models.price_list, { foreignKey: 'price_list_id' });
        }
    };
    price.init({
        variant_id: DataTypes.INTEGER,
        price_list_id: DataTypes.INTEGER,
        price: DataTypes.FLOAT,
        compare_at_price: DataTypes.FLOAT,
        currency: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'price',
    });
    return price;
};