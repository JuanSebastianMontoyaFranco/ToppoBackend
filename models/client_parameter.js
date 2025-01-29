'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class client_parameter extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    client_parameter.init({
        user_id: DataTypes.INTEGER,
        check_client: DataTypes.BOOLEAN,
        client_nit: DataTypes.STRING,
        seller_nit: DataTypes.STRING,
        prefix: DataTypes.STRING,
        payment_method: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'client_parameter',
    });
    return client_parameter;
};