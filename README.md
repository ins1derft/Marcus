# Boilerplate for building a web application.
Next.js, Strapi, PostgreSQL, Meilisearch, Nginx, Docker.

## Instruction 📖
- In the Docker folder, configure the environment.
- Start development and customize strapi.
- Add the resulting strapi token to the environment (it will be available on the frontend).
- Configure Meilisearch credentials in the environment and Strapi plugin settings (see `docker/.env.*`).
- On production, configure the nginx configuration for your domain. Also change the environment for production.
- Get ssl certificate using certbot for your server.

## Docker 🐳

#### Running containers for development:
```
docker compose -f development.compose.yml --env-file .env.development up --build
```
or
```
./compose.sh development up --build
```

#### Running containers for production:
```
docker compose -f production.compose.yml --env-file .env.production up -d --build
```
or
```
./compose.sh production up -d --build
```

#### Removing containers:
```
docker compose -f *.compose.yml down
```
or
```
./compose.sh * down
```

## Meilisearch 🔍
- Default container hostname: `http://meilisearch:7700`.
- Master key is provided through `MEILISEARCH_MASTER_KEY` in `docker/.env.*` and passed to Strapi.
- Frontend expects a search-only key in `MEILISEARCH_MASTER_KEY` exposed as `NEXT_PUBLIC_MEILISEARCH_API_KEY`.
- Strapi integrates through `strapi-plugin-meilisearch`; adjust plugin configuration if you need advanced indexing rules.

## Strapi 🛠️
### REST Cache на Redis ⚡
- Переменные окружения: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`, `REDIS_CACHE_DB`, `REDIS_CACHE_PREFIX`, `REDIS_CACHE_TTL`, `REDIS_CACHE_CONTENT_TYPES`.
- Кеш работает через `@strapi-community/plugin-rest-cache` с провайдером Redis: ключи собираются с префиксом из `REDIS_CACHE_PREFIX`, время жизни (секунды) задаёт `REDIS_CACHE_TTL`.
- Список кешируемых коллекций можно переопределить в `REDIS_CACHE_CONTENT_TYPES` (по умолчанию подключаем витринные коллекции каталога — категории, товары, вариации, страницы и портфолио; список фильтруется по реально существующим схемам).
- Сбросить кеш: `pnpm --filter strapi strapi console` → `strapi.plugin('rest-cache').service('cacheManager').clear()`.
- Подробности интеграции: [Strapi REST Cache + Redis](https://strapi-community.github.io/plugin-rest-cache/providers/redis).

#### Data export without encryption and compression:
*Local*
```
pnpm run strapi export --no-encrypt --no-compress -f export-data
```

*Development*
```
./export-strapi-development.sh containerId?
```

*Production*
```
./export-strapi-production.sh user@host containerId?
```

#### Data import:
*Local*
```
pnpm run strapi import -f export-data.tar
```

*Development*
```
./import-strapi-development.sh containerId?
```

*Production*
```
./import-strapi-production.sh user@host containerId?
```

## Certbot 🤖
#### Obtaining ssl certificate:
```
docker compose -f production.compose.yml run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot/ \
  -d vpsmarcus.itts.su \
  -d www.vpsmarcus.itts.su \
  -d api.vpsmarcus.itts.su \
  -d cms.vpsmarcus.itts.su
```

Сертификат для всех SAN-доменов появится в `certbot/conf/live/vpsmarcus.itts.su/`. После получения сертификата перезапусти `nginx`, чтобы он подхватил новые файлы.
