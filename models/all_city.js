'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class all_city extends Model {
    static associate(models) {
      // define association here
    }
  };
  all_city.init({
    department_id: DataTypes.STRING,
    city_id: DataTypes.STRING,
    department_desc: DataTypes.STRING,
    city_desc: DataTypes.STRING,
    city: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'all_city'
  });
  return all_city;
};