'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      order_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'orders',
          key: 'order_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      doc_number: {
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.STRING
      },
      sku: {
        type: Sequelize.STRING,
      },
      item_name: {
        type: Sequelize.STRING
      },
      qty: {
        type: Sequelize.INTEGER,
      },
      option: {
        type: Sequelize.STRING
      },
      unitary_price_1: {
        type: Sequelize.DECIMAL,
      },
      unitary_price_tax_1: {
        type: Sequelize.DECIMAL
      },
      unitary_price_2: {
        type: Sequelize.DECIMAL,
      },
      unitary_price_tax_2: {
        type: Sequelize.DECIMAL
      },
      discounted_percentage: {
        type: Sequelize.DECIMAL,
      },
      discounted_value_1: {
        type: Sequelize.FLOAT,
      },
      discounted_value_2: {
        type: Sequelize.FLOAT,
      },
      base_price_2: {
        type: Sequelize.FLOAT,
      },
      tax_percentage: {
        type: Sequelize.FLOAT,
      },
      tax: {
        type: Sequelize.DECIMAL,
      },
      line_total_1: {
        type: Sequelize.FLOAT,
      },
      line_total_2: {
        type: Sequelize.FLOAT,
      },
      cupon_produc_value: {
        type: Sequelize.FLOAT
      },
      cupon_servic_value: {
        type: Sequelize.FLOAT
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
    await queryInterface.dropTable('order_items');
  }
};

