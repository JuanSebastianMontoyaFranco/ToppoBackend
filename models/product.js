'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product extends Model {
    static associate(models) {
      product.belongsTo(models.user, { foreignKey: 'user_id' });

      product.hasMany(models.channel_product, { foreignKey: 'product_id'})
      product.hasMany(models.variant, { foreignKey: 'product_id'})

    }
  };
  product.init({
    user_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    vendor: DataTypes.STRING,
    product_type: DataTypes.STRING,
    template: DataTypes.STRING,
    tags: DataTypes.STRING,
    status: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'product',
  });
  return product;
};