'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  findOne: async (ctx) => {
    const kickstarter = await strapi.services.kickstarter.findOne({ id: ctx.params.id });
    const pledges = await strapi.services.pledge.find({ id: kickstarter.pledges.map((p) => p.id) });
    const contracts = pledges.flatMap((p) => p.contracts);
    // const users = await strapi.services.users.find({ id: contracts.map(({ user }) => user) });
    const users = await strapi.query('user', 'users-permissions').find({ id: contracts.map(({ user }) => user) }, ['role']);
    const updatedPledges = pledges.map((pledge) => {
      const updatedContracts = pledge.contracts.map((contract) => {
        const currentUser = users.find(({ id }) => id === contract.user);
        if (!currentUser) {
          return contract;
        }
        return { ...contract, user: { id: currentUser.id, username: currentUser.username } };
      });
      return { ...pledge, contracts: updatedContracts };
    });
    console.log(users);
    return { ...kickstarter, pledges: updatedPledges };
  }
};
