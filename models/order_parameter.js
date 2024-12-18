'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class order_parameter extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    order_parameter.init({
        user_id: DataTypes.INTEGER,
        main: DataTypes.INTEGER,
        active: DataTypes.BOOLEAN,
        branch_id_default: DataTypes.INTEGER,
        branch_name_default: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'order_parameter',
    });
    return order_parameter;
};