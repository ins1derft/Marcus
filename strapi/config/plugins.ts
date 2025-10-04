import fs from 'node:fs';
import path from 'node:path';

const defaultCachedContentTypes = [
  'api::category.category',
  'api::product.product',
  'api::product-variant.product-variant',
  'api::page.page',
  'api::portfolio-item.portfolio-item',
];

const resolveContentTypeSchemaPath = (uid: string) => {
  const match = uid.match(/^api::([a-z0-9-]+)\.([a-z0-9-]+)$/i);

  if (!match) {
    return null;
  }

  const [, apiName, contentTypeName] = match;

  return path.resolve(__dirname, '..', '..', 'src', 'api', apiName, 'content-types', contentTypeName, 'schema.json');
};

const filterExistingContentTypes = (uids: string[]) =>
  uids
    .map((uid) => uid.trim())
    .filter((uid) => {
      const schemaPath = resolveContentTypeSchemaPath(uid);

      return Boolean(schemaPath && fs.existsSync(schemaPath));
    });

const normalizeContentTypes = (env: any) => {
  const recommendedContentTypes = filterExistingContentTypes(defaultCachedContentTypes);
  const configuredContentTypes = env.array('REDIS_CACHE_CONTENT_TYPES', recommendedContentTypes);
  return filterExistingContentTypes(configuredContentTypes);
};

export default ({ env }: { env: any }) => {
  const upload = {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          accessKeyId: env('S3_ACCESS_KEY_ID'),
          secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
          region: env('S3_REGION'),
          ...(env('S3_ENDPOINT') ? { endpoint: env('S3_ENDPOINT') } : {}),
          forcePathStyle: env.bool('S3_FORCE_PATH_STYLE', false),
          baseUrl: env('S3_CDN_BASE_URL'),
          params: {
            ACL: env('S3_ACL', 'public-read'),
            signedUrlExpires: env.int('S3_SIGNED_URL_EXPIRES', 15 * 60),
            Bucket: env('S3_BUCKET'),
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };

  const meilisearchHost = env('MEILISEARCH_HOST');
  const meilisearchApiKey = env('MEILISEARCH_MASTER_KEY');

  const redisHost = env('REDIS_HOST', '127.0.0.1');
  const redisPort = env.int('REDIS_PORT', 6379);
  const redisPassword = env('REDIS_PASSWORD');
  const redisDb = env.int('REDIS_CACHE_DB', 0);
  const redisTls = env.bool('REDIS_TLS', false);

  const redisCachePrefix = env('REDIS_CACHE_PREFIX', 'strapi:rest-cache:');
  const redisCacheTtl = env.int('REDIS_CACHE_TTL', 300);
  const cacheContentTypes = normalizeContentTypes(env);

  const meilisearch =
    meilisearchHost && meilisearchApiKey
      ? {
          meilisearch: {
            config: {
              host: meilisearchHost,
              apiKey: meilisearchApiKey,
            },
          },
        }
      : {};

  return {
    ...upload,
    redis: {
      config: {
        connections: {
          default: {
            connection: {
              host: redisHost,
              port: redisPort,
              db: redisDb,
              ...(redisPassword ? { password: redisPassword } : {}),
              ...(redisTls ? { tls: {} } : {}),
            },
          },
        },
      },
    },
    'rest-cache': {
      config: {
        provider: {
          name: 'redis',
          options: {
            connection: 'default',
            namespace: redisCachePrefix,
            ttl: redisCacheTtl * 1000,
          },
        },
        strategy: {
          name: 'content-api',
          enableXCacheHeaders: true,
          maxAge: redisCacheTtl,
          keysPrefix: redisCachePrefix,
          contentTypes: cacheContentTypes,
        },
      },
    },
    ...meilisearch,
  };
};
