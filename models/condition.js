'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class condition extends Model {
    static associate(models) {
      condition.belongsTo(models.price_list, { foreignKey: 'price_list_id' });
    }
  };
  condition.init({
    price_list_id: DataTypes.INTEGER,
    check_visibility_price: DataTypes.BOOLEAN,
    check_percentage: DataTypes.BOOLEAN,
    percentage: DataTypes.INTEGER,
    check_base_price: DataTypes.BOOLEAN,
    base_price: DataTypes.BIGINT,
    check_conditional: DataTypes.BOOLEAN,
    check_min_qty: DataTypes.BOOLEAN,
    min_qty: DataTypes.INTEGER,
    check_min_price: DataTypes.BOOLEAN,
    min_price: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'condition',
  });
  return condition;
};