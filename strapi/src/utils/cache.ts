export const getDefaultRedisConnection = () =>
  strapi.plugin('redis').service('connection').get('default');

export type RedisConnection = ReturnType<typeof getDefaultRedisConnection>;
