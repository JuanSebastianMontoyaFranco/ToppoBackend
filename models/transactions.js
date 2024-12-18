'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class transaction extends Model {
    static associate(models) {
      // Define association here
    }
  }

  transaction.init({
    order_id: DataTypes.BIGINT,
    transaction_id: DataTypes.BIGINT,
    gateway: DataTypes.STRING,
    payment_id: DataTypes.STRING,
    amount: DataTypes.STRING,
    date_create: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'transaction',
  });

  return transaction;
};