'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class channel_product extends Model {
        static associate(models) {
            channel_product.belongsTo(models.product, { foreignKey: 'product_id' });
            channel_product.belongsTo(models.channel, { foreignKey: 'channel_id' });
        }
    };
    channel_product.init({
        product_id: DataTypes.INTEGER,
        channel_id: DataTypes.INTEGER,
        ecommerce_id: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'channel_product',
    });
    return channel_product;
};