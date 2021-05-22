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
    const entityExist = await strapi.services.contract.find({ pledge: contract.pledge, user: id });
    if (entityExist) {
      return ctx.throw(409, 'Already exist');
    }
    const entity = await strapi.services.contract.create(contract);
    return sanitizeEntity(entity, { model: strapi.models.pledge });
  },
};
