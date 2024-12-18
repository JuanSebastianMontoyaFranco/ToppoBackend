'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      first_name: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      last_name: {
        type: Sequelize.STRING(100)
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      active: {
        type: Sequelize.BOOLEAN,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      address: {
        type: Sequelize.STRING(255),
      },
      department: {
        type: Sequelize.STRING(150),
      },
      city: {
        type: Sequelize.STRING(100),
      },
      role: {
        allowNull: false,
        type: Sequelize.STRING(50)
      },
      wholesale: {
        type: Sequelize.BOOLEAN
      },  
      token: {
        type: Sequelize.STRING(255)
      },
      confirmed: {
        type: Sequelize.BOOLEAN,
      },
      image_url: {
        type: Sequelize.STRING(255),
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
    await queryInterface.dropTable('users');
  }
};

