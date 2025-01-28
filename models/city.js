'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class city extends Model {
    static associate(models) {
      // define association here
    }
  };
  city.init({
    department_id: DataTypes.STRING,
    city_id: DataTypes.STRING,
    department_desc: DataTypes.STRING,
    city_desc: DataTypes.STRING,
    city_desc_2: DataTypes.STRING,
    city: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'city'
  });
  return city;
};