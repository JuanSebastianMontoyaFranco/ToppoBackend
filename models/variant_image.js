'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class variant_image extends Model {
        static associate(models) {
            variant_image.belongsTo(models.variant, { foreignKey: 'variant_id' });
        }
    };
    variant_image.init({
        variant_id: DataTypes.INTEGER,
        image_url: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'variant_image',
    });
    return variant_image;
};