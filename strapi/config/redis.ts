import Redis, { type RedisOptions } from 'ioredis';

export type StrapiEnvAccessor = {
  (key: string, defaultValue?: string): string | undefined;
  int(key: string, defaultValue?: number): number;
  bool(key: string, defaultValue?: boolean): boolean;
};

export type RedisConnectionOptions = Pick<
  RedisOptions,
  'host' | 'port' | 'username' | 'password' | 'db' | 'tls'
>;

const parseInteger = (value: string | undefined, defaultValue: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isNaN(parsed) ? defaultValue : parsed;
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value == null) {
    return defaultValue;
  }

  const normalized = value.toLowerCase();

  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const normalizeRedisOptions = (options: RedisConnectionOptions): RedisConnectionOptions => {
  const normalized: RedisConnectionOptions = {
    host: options.host,
    port: options.port,
    db: options.db ?? 0,
  };

  if (options.username) {
    normalized.username = options.username;
  }

  if (options.password) {
    normalized.password = options.password;
  }

  if (options.tls) {
    normalized.tls = options.tls;
  }

  return normalized;
};

export const resolveRedisOptionsFromStrapiEnv = (env: StrapiEnvAccessor): RedisConnectionOptions =>
  normalizeRedisOptions({
    host: env('REDIS_HOST', 'redis') ?? 'redis',
    port: env.int('REDIS_PORT', 6379),
    username: env('REDIS_USERNAME'),
    password: env('REDIS_PASSWORD'),
    db: env.int('REDIS_DB', 0),
    tls: env.bool('REDIS_TLS', false) ? {} : undefined,
  });

export const resolveRedisOptionsFromProcessEnv = (): RedisConnectionOptions =>
  normalizeRedisOptions({
    host: process.env.REDIS_HOST ?? 'redis',
    port: parseInteger(process.env.REDIS_PORT, 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    db: parseInteger(process.env.REDIS_DB, 0),
    tls: parseBoolean(process.env.REDIS_TLS, false) ? {} : undefined,
  });

let cachedClient: Redis | null = null;

export const getRedisClient = (env?: StrapiEnvAccessor): Redis => {
  if (!cachedClient) {
    const baseOptions = env
      ? resolveRedisOptionsFromStrapiEnv(env)
      : resolveRedisOptionsFromProcessEnv();

    cachedClient = new Redis({
      ...baseOptions,
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableAutoPipelining: true,
    });
  }

  return cachedClient;
};

export const createRedisClient = (overrides?: Partial<RedisOptions>): Redis =>
  new Redis({
    ...resolveRedisOptionsFromProcessEnv(),
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableAutoPipelining: true,
    ...overrides,
  });

const SESSION_PREFIX = 'strapi:sess:';

type KoaSessionState = Record<string, unknown>;

export type KoaSessionStore = {
  get(key: string): Promise<KoaSessionState | undefined>;
  set(
    key: string,
    session: KoaSessionState,
    maxAge?: number,
    options?: { rolling: boolean; changed: boolean },
  ): Promise<void>;
  destroy(key: string): Promise<void>;
};

const resolveSessionKey = (key: string): string => `${SESSION_PREFIX}${key}`;

const computeTtlInSeconds = (maxAge?: number): number | undefined => {
  if (typeof maxAge !== 'number') {
    return undefined;
  }

  const ttl = Math.ceil(maxAge / 1000);

  return ttl > 0 ? ttl : undefined;
};

export const createRedisSessionStore = (env?: StrapiEnvAccessor): KoaSessionStore => {
  const client = getRedisClient(env);

  return {
    async get(key) {
      const raw = await client.get(resolveSessionKey(key));

      if (!raw) {
        return undefined;
      }

      try {
        return JSON.parse(raw) as KoaSessionState;
      } catch (error) {
        await client.del(resolveSessionKey(key));
        return undefined;
      }
    },
    async set(key, session, maxAge) {
      const redisKey = resolveSessionKey(key);
      const payload = JSON.stringify(session);
      const ttl = computeTtlInSeconds(maxAge);

      if (ttl) {
        await client.set(redisKey, payload, 'EX', ttl);
      } else {
        await client.set(redisKey, payload);
      }
    },
    async destroy(key) {
      await client.del(resolveSessionKey(key));
    },
  };
};

const redis = getRedisClient();

export default redis;
