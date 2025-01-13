'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sync_parameters', {
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
      sync_status: {
        type: Sequelize.BOOLEAN,
      },
      security_inventory: {
        type: Sequelize.BOOLEAN
      },
      product_type: {
        type: Sequelize.BOOLEAN
      },
      price: {
        type: Sequelize.BOOLEAN,
      },
      compare_at_price: {
        type: Sequelize.BOOLEAN
      },
      price_list_serpi: {
        type: Sequelize.INTEGER
      },
      branch_serpi: {
        type: Sequelize.INTEGER
      },
      all_products: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('sync_parameters');
  }
};
