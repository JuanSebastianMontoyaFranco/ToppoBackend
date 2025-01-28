'use strict';

const { STRING } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cities', {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true,
      },
      department_id: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      city_id: {
        allowNull: STRING,
        type: Sequelize.STRING
      },
      department_desc: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      city_desc: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      city_desc_2: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      city: {
        allowNull: false,
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
    await queryInterface.dropTable('cities');
  }
};

