'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    static associate(models) {
    }
  };
  user.init({
    identification: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    department: DataTypes.STRING,
    city: DataTypes.STRING,
    role: DataTypes.STRING,
    wholesale: DataTypes.BOOLEAN,
    token: DataTypes.STRING,
    confirmed: DataTypes.BOOLEAN,
    image_url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};