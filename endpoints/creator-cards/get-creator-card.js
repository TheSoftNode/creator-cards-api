const { createHandler } = require('@app-core/server');
const getCreatorCardService = require('@app/services/creator-cards/get-creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const { access_code: accessCode } = rc.query;

    const response = await getCreatorCardService(slug, accessCode);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      data: response,
    };
  },
});
