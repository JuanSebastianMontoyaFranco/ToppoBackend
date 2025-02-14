'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class sync_parameter extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    sync_parameter.init({
        user_id: DataTypes.INTEGER,
        sync_status: DataTypes.BOOLEAN,
        title: DataTypes.BOOLEAN,
        product_type: DataTypes.BOOLEAN,
        price: DataTypes.BOOLEAN,
        compare_at_price: DataTypes.BOOLEAN,
        tags: DataTypes.BOOLEAN,
        vendor: DataTypes.BOOLEAN,
        description: DataTypes.BOOLEAN,
        security_inventory: DataTypes.BOOLEAN,
        price_list_serpi: DataTypes.INTEGER,
        branch_serpi: DataTypes.INTEGER,
        all_products: DataTypes.BOOLEAN,
    }, {
        sequelize,
        modelName: 'sync_parameter',
    });
    return sync_parameter;
};