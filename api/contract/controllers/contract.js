'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

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
    const { id } = await strapi.plugins[
      'users-permissions'
    ].services.jwt.getToken(ctx);
    const contract = {
      ...ctx.request.body,
      user: id,
      status: 'waiting',
      contract_date: new Date(),
    };
    const entityExist = await strapi.services.contract.findOne({ pledge: contract.pledge, user: id });
    const entity = entityExist ?
      await strapi.services.contract.update({ id: entityExist.id }, entityExist, { ...contract, updated_by: user.id }) :
      await strapi.services.contract.create({ ...contract, created_by: user.id, updated_by: user.id });
    return sanitizeEntity(entity, { model: strapi.models.pledge });
  },
};
