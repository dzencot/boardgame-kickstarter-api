'use strict';

const axios = require('axios');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const parseKickstartersJson = (jsonData) => {
  const { projects } = jsonData;
  const result = projects.map((project) => ({
    kickstarter: {
      title: project.name,
      url: project.urls.web.project,
      kickstarter_id: project.id.toString(),
      start_date: new Date(project.launched_at),
      finish_date: new Date(project.deadline),
      slug: project.slug,
      json: JSON.stringify(project),
    },
    images: {
      key: project.photo.key,
      full: project.photo.full,
      ed: project.photo.ed,
      med: project.photo.med,
      little: project.photo.little,
      small: project.photo.small,
      thumb: project.photo.thumb,
      '1024x576': project.photo['1024x576'],
      '1536x864': project.photo['1536x864'],
    },
  }));

  return result;
};

const uploadKickstarters = (kickstarters) => {
  const promises = kickstarters.map(async (kickstarterData) => {
    const { kickstarter, images } = kickstarterData;
    const links = {
      full: images.full,
      ed: images.ed,
      med: images.med,
      little: images.little,
      small: images.small,
      thumb: images.thumb,
    };

    // const uploadDataKick = await axios({
    //   method: 'post',
    //   url: route.kickstartersPath(),
    //   data: kickstarter,
    //   headers: {
    //     Authorization: getAuthToken(),
    //   },
    // });
    const uploadDataKick = await strapi.services.kickstarter.create(kickstarter);
    const dataKick = uploadDataKick;
    // const dataKick = {};
    console.log('dataKick:', dataKick);

    const imagesUploadPromises = Object.entries(links).map(async ([imageType, link]) => {
      const imageData = await axios.get(link, { responseType: 'arraybuffer' });
      // console.log('imageData', imageData);

      // const image = new Blob([imageData.data], { type: 'image/jpg' });
      // const fileName = `${kickstarter.slug}-${imageType}`;

      // const uploadData = new FormData();
      // uploadData.append('files', image, fileName);
      // uploadData.append('path', 'kickstarters');
      // uploadData.append('refId', dataKick.id);
      // uploadData.append('ref', 'kickstarter');
      // uploadData.append('field', `image_${imageType}`);

      const uploadData = {
        data: {
          refId: dataKick.id,
          ref: 'kickstarter',
          field: `image_${imageType}`,
        },
        files: imageData.data,
      };

      return strapi.services.upload.create(uploadData);
      // return axios({
      //   method: 'post',
      //   url: '/upload',
      //   data: uploadData,
      //   headers: {
      //     Authorization: ctx.header.authorization,
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
      // console.log('uploadData:', uploadedResponse);
    });

    return Promise.all(imagesUploadPromises);
  });

  return Promise.all(promises);
};

module.exports = {
  create: async (ctx) => {
    const kickApi = 'https://www.kickstarter.com/discover/advanced';
    // ?term=%CE%A7%CF%81%CF%8C%CE%BD%CE%BF%CF%82+Project&sort=magic&format=json
    const kickstarterName = ctx.request.body.title;
    const kickUrl = new URL(kickApi);
    kickUrl.searchParams.set('term', kickstarterName);
    kickUrl.searchParams.set('format', 'json');
    console.log(`url: ${kickUrl.toString()}`);
    const { data } = await axios.get(kickUrl.toString());
    const parsedData = parseKickstartersJson(data);
    const uploadedData = await Promise.all(parsedData.map(({ kickstarter }) =>
      strapi.services.kickstarter.create(kickstarter)));
    // const addedData = await uploadKickstarters(parsedData, ctx);
    return { parsedData, uploadedData };
  },

  findOne: async (ctx) => {
    const kickstarter = await strapi.services.kickstarter.findOne({ id: ctx.params.id });
    const pledges = await strapi.services.pledge.find({ id: kickstarter.pledges.map((p) => p.id) });
    const contracts = pledges.flatMap((p) => p.contracts);
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
    return { ...kickstarter, pledges: updatedPledges };
  }
};
