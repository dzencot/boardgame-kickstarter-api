'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  findOne: async (ctx) => {
    const projectContract = await strapi.services.project.findOne({ id: ctx.params.id });
    const contracts = projectContract.project_contracts;
    const users = await strapi.query('user', 'users-permissions').find({ id: contracts.map(({ user }) => user) }, ['role']);
    const updatedContracts = contracts.map((contract) => {
      const currentUser = users.find(({ id }) => id === contract.user);
      if (!currentUser) {
        return contract;
      }
      return { ...contract, user: { id: currentUser.id, username: currentUser.username } };
    });
    return { ...projectContract, project_contracts: updatedContracts };
  },
};
