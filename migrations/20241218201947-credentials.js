'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('credentials', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      main: {
        type: Sequelize.INTEGER
      },
      store_domain: {
        type: Sequelize.STRING,
      },
      shopify_domain: {
        type: Sequelize.STRING,
      },
      token_shopify: {
        type: Sequelize.STRING,
      },
      token_serpi: {
        type: Sequelize.TEXT,
      },
      secret_key_serpi: {
        type: Sequelize.STRING,
      },
      token_histoweb: {
        type: Sequelize.TEXT,
      },
      url_histoweb_products: {
        type: Sequelize.TEXT,
      },
      url_histoweb_services: {
        type: Sequelize.TEXT,
      },
      hook_histoweb: {
        type: Sequelize.TEXT,
      },
      sync_time: {
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credentials');
  }
};
