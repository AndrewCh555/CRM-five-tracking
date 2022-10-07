'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('access', 'permissions');
    await queryInterface.bulkDelete('permissions', { permission: false });
    await queryInterface.removeColumn('permissions', 'permission');
    await queryInterface.addColumn('departments', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Date.now(),
    });
    await queryInterface.addColumn('departments', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Date.now(),
    });
    await queryInterface.renameTable('projectUsers', 'projectsUsers');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('permissions', 'access');
    await queryInterface.addColumn('access', 'permission', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.removeColumn('departments', 'createdAt');
    await queryInterface.removeColumn('departments', 'updatedAt');
    await queryInterface.renameTable('projectsUsers', 'projectUsers');
  },
};
