'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      order_id: {
        type: Sequelize.BIGINT,
      },
      transaction_id: {
        type: Sequelize.BIGINT
      },
      gateway: {
        type: Sequelize.STRING,
      },
      payment_id: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.STRING
      },
      date_create: {
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
    await queryInterface.dropTable('transactions');
  }
};
