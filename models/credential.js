'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class credential extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  credential.init({
    user_id: DataTypes.INTEGER,
    main: DataTypes.INTEGER,
    store_domain: DataTypes.STRING,
    shopify_domain: DataTypes.STRING,
    token_shopify: DataTypes.STRING,
    token_serpi: DataTypes.TEXT,
    secret_key_serpi: DataTypes.STRING,
    token_histoweb: DataTypes.TEXT,
    url_histoweb_products: DataTypes.TEXT,
    url_histoweb_services: DataTypes.TEXT,
    hook_histoweb: DataTypes.TEXT,
    sync_time: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'credential',
  });
  return credential;
};