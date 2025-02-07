'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class variant extends Model {
        static associate(models) {
            variant.belongsTo(models.product, { foreignKey: 'product_id' });

            variant.hasMany(models.price, { foreignKey: 'variant_id' });
            variant.hasMany(models.variant_image, { foreignKey: 'variant_id' });  // Relación con las imágenes

        }
    };
    variant.init({
        product_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        sku: DataTypes.STRING,
        title: DataTypes.STRING,
        option_1: DataTypes.STRING,
        option_2: DataTypes.STRING,
        option_3: DataTypes.STRING,
        barcode: DataTypes.STRING,
        requires_shipping: DataTypes.BOOLEAN,
        inventory_policy: DataTypes.STRING,
        inventory_quantity: DataTypes.INTEGER,
        inventory_management: DataTypes.STRING,
        fullfilment_service: DataTypes.STRING,
        taxable: DataTypes.BOOLEAN,
        tax_percentage: DataTypes.FLOAT,
        weight: DataTypes.FLOAT,
        weight_unit: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'variant',
    });
    return variant;
};