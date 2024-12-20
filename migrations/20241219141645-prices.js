'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('prices', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      variant_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'variants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      price: {
        type: Sequelize.FLOAT,
      },
      compare_at_price: {
        type: Sequelize.FLOAT,
      },
      currency: {
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
    await queryInterface.dropTable('prices');
  }
};
