'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class channel extends Model {
    static associate(models) {
      
    }
  };
  channel.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'channel',
  });
  return channel;
};