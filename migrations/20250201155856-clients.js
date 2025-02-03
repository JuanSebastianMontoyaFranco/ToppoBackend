'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clients', {
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
    await queryInterface.dropTable('clients');
  }
};
