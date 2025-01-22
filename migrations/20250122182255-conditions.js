'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('conditions', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      price_list_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'price_lists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      check_visibility_price: {
        type: Sequelize.BOOLEAN,
      },
      check_percentage: {
        type: Sequelize.BOOLEAN,
      },
      percentage: {
        type: Sequelize.INTEGER
      },
      check_base_price: {
        type: Sequelize.BOOLEAN,
      },
      base_price: {
        type: Sequelize.BIGINT,
      },
      check_conditional: {
        type: Sequelize.BOOLEAN,
      },
      check_min_qty: {
        type: Sequelize.BOOLEAN,
      },
      min_qty: {
        type: Sequelize.INTEGER,
      },
      check_min_price: {
        type: Sequelize.BOOLEAN,
      },
      min_price: {
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
    await queryInterface.dropTable('conditions');
  }
};
