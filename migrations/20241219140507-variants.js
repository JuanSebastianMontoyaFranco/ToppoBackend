'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('variants', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sku: {
        tye: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      option_1: {
        type: Sequelize.STRING
      },
      option_2: {
        type: Sequelize.STRING
      },
      option_3: {
        type: Sequelize.STRING
      },
      barcode: {
        type: Sequelize.STRING
      },
      requires_shipping: {
        type: Sequelize.BOOLEAN
      },
      inventory_policy: {
        type: Sequelize.STRING
      },
      inventory_quantity: {
        type: Sequelize.BOOLEAN
      },
      inventory_management: {
        type: Sequelize.STRING
      },
      fullfilment_service: {
        type: Sequelize.STRING
      },
      taxable: {
        type: Sequelize.BOOLEAN
      },
      weight: {
        type: Sequelize.FLOAT
      },
      weight_unit: {
        type: Sequelize.STRING
      },
      image_url: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('variants');
  }
};
