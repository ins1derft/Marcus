import { resolveRedisOptionsFromStrapiEnv } from './redis';

export default ({ env }) => {
  const isProduction = env('NODE_ENV', 'development') === 'production';

  return [
    'strapi::logger',
    'strapi::errors',
    'strapi::security',
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    {
      name: 'strapi::session',
      config: {
        key: 'strapi:sess',
        rolling: true,
        renew: true,
        secure: isProduction,
        sameSite: isProduction ? 'lax' : 'none',
        store: {
          type: 'redis',
          options: resolveRedisOptionsFromStrapiEnv(env),
        },
      },
    },
    'strapi::favicon',
    'strapi::public',
  ];
};
