export default ({ env }) => {
  const hosts = ['https://market-assets.strapi.io'];

  const s3CdnBaseUrl = env('S3_CDN_BASE_URL');
  const s3Endpoint = env('S3_ENDPOINT');

  if (s3CdnBaseUrl) {
    hosts.push(s3CdnBaseUrl.replace(/\/$/, ''));
  } else if (s3Endpoint) {
    hosts.push(s3Endpoint.replace(/\/$/, ''));
  }

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'img-src': ["'self'", 'data:', 'blob:', ...hosts],
            'media-src': [...hosts],
          },
        },
      },
    },
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
