'use strict';

const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    const user = await strapi.plugins[
      'users-permissions'
    ].services.jwt.getToken(ctx);
    const projectContract = {
      ...ctx.request.body,
      user: user.id,
      status: 'waiting',
      contract_date: new Date(),
    };
    const entityExist = await strapi.services['project-contract'].findOne({ project: projectContract.project, user: user.id });
    const entity = entityExist ?
      await strapi.services['project-contract'].update({ id: entityExist.id }, entityExist, { ...projectContract, updated_by: user.id }) :
      await strapi.services['project-contract'].create({ ...projectContract, created_by: user.id, updated_by: user.id });
    return sanitizeEntity(entity, { model: strapi.models['project-contract'] });
  },
};
