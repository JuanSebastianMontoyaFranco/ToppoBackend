'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class sync_log extends Model {
        static associate(models) {
            sync_log.belongsTo(models.user, { foreignKey: 'user_id' });
        }
    };
    sync_log.init({
        user_id: DataTypes.INTEGER,
        sync_form: DataTypes.STRING,
        date: DataTypes.DATE,
    }, {
        sequelize,
        modelName: 'sync_log',
    });
    return sync_log;
};