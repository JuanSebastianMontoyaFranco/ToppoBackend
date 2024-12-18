'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        primaryKey: true,

      },
      user_id: {
        type: Sequelize.INTEGER,
      },
      ecommerce_id: {
        type: Sequelize.STRING
      },
      invoice_id: {
        type: Sequelize.STRING
      },
      ecommerce_reference: {
        type: Sequelize.STRING
      },
      ecommerce_name: {
        type: Sequelize.STRING
      },
      doc_number: {
        type: Sequelize.INTEGER
      },
      prefix: {
        type: Sequelize.STRING
      },
      date_create: {
        type: Sequelize.STRING,
      },
      date_update: {
        type: Sequelize.STRING
      },
      payment: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      transaction_id: {
        type: Sequelize.STRING,
      },
      customer_ip_address: {
        type: Sequelize.STRING,
      },
      customer_user: {
        type: Sequelize.STRING,
      },
      billing_id: {
        type: Sequelize.STRING,
      },
      billing_first_name: {
        type: Sequelize.STRING,
      },
      billing_last_name: {
        type: Sequelize.STRING,
      },
      billing_email: {
        type: Sequelize.STRING,
      },
      billing_phone: {
        type: Sequelize.STRING,
      },
      billing_address_1: {
        type: Sequelize.STRING,
      },
      billing_address_2: {
        type: Sequelize.STRING,
      },
      billing_city_id: {
        type: Sequelize.STRING,
      },
      billing_city: {
        type: Sequelize.STRING,
      },
      billing_format_city: {
        type: Sequelize.STRING,
      },
      billing_state: {
        type: Sequelize.STRING,
      },
      billing_country: {
        type: Sequelize.STRING,
      },
      shipping_id: {
        type: Sequelize.STRING,
      },
      shipping_first_name: {
        type: Sequelize.STRING,
      },
      shipping_last_name: {
        type: Sequelize.STRING,
      },
      shipping_email: {
        type: Sequelize.STRING,
      },
      shipping_phone: {
        type: Sequelize.STRING,
      },
      shipping_address_1: {
        type: Sequelize.STRING,
      },
      shipping_address_2: {
        type: Sequelize.STRING,
      },
      shipping_city_id: {
        type: Sequelize.STRING,
      },
      shipping_city: {
        type: Sequelize.STRING,
      },
      shipping_format_city: {
        type: Sequelize.STRING,
      },
      shipping_state: {
        type: Sequelize.STRING,
      },
      shipping_country: {
        type: Sequelize.STRING,
      },
      branch_id: {
        type: Sequelize.INTEGER,
      },
      whorehouse_id: {
        type: Sequelize.INTEGER,
      },
      pricelist_id: {
        type: Sequelize.INTEGER,
      },
      pricelist_id: {
        type: Sequelize.INTEGER,
      },
      purchase_number: {
        type: Sequelize.BIGINT,
      },
      order_total: {
        type: Sequelize.FLOAT,
      },
      shipping_total: {
        type: Sequelize.FLOAT
      },
      note: {
        type: Sequelize.STRING,
      },
      cupon_code: {
        type: Sequelize.STRING,
      },
      state: {
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.BIGINT,
      },
      message: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('orders');
  }
};

