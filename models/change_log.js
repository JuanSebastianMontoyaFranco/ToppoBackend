'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class change_log extends Model {
        static associate(models) {
            change_log.belongsTo(models.product, { foreignKey: 'product_id' });
            change_log.belongsTo(models.variant, { foreignKey: 'variant_id' });
            change_log.belongsTo(models.price_list, { foreignKey: 'price_list_id' });
            change_log.belongsTo(models.channel, { foreignKey: 'channel_id' });
        }
    };
    change_log.init({
        product_id: DataTypes.INTEGER,
        variant_id: DataTypes.INTEGER,
        price_list_id: DataTypes.INTEGER,
        channel_id: DataTypes.INTEGER,
        field: DataTypes.STRING,
        oldValue: DataTypes.TEXT,
        newValue: DataTypes.TEXT,
        state: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'change_log',
    });
    return change_log;
};