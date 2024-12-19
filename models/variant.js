'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class variant extends Model {
        static associate(models) {
            variant.belongsTo(models.product, { foreignKey: 'product_id' });
        }
    };
    variant.init({
        title: DataTypes.STRING,
        option_1: DataTypes.STRING,
        option_2: DataTypes.STRING,
        option_3: DataTypes.STRING,
        barcode: DataTypes.STRING,
        requires_shipping: DataTypes.BOOLEAN,
        inventory_policy: DataTypes.STRING,
        inventory_quantity: DataTypes.BOOLEAN,
        inventory_management: DataTypes.STRING,
        fullfilment_service: DataTypes.STRING,
        taxable: DataTypes.BOOLEAN,
        weight: DataTypes.FLOAT,
        weight_unit: DataTypes.STRING,
        image_url: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'variant',
    });
    return variant;
};