export default ({ env }) => {
  const hosts = ['https://market-assets.strapi.io'];

  const appendHost = (value?: string) => {
    if (!value) {
      return;
    }

    const trimmed = value.replace(/\/$/, '');

    try {
      const { origin } = new URL(trimmed);

      hosts.push(origin);

      if (trimmed !== origin) {
        hosts.push(trimmed);
      }

      return;
    } catch (error) {
      // ignore parsing error and fall back to trimmed value
    }

    hosts.push(trimmed);
  };

  const s3CdnBaseUrl = env('S3_CDN_BASE_URL');
  const s3Endpoint = env('S3_ENDPOINT');

  if (s3CdnBaseUrl) {
    appendHost(s3CdnBaseUrl);
  } else if (s3Endpoint) {
    appendHost(s3Endpoint);
  }

  const uniqueHosts = Array.from(new Set(hosts));

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'img-src': ["'self'", 'data:', 'blob:', ...uniqueHosts],
            'media-src': [...uniqueHosts],
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
