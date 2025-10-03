# Бойлерплейт для веб-приложения
Next.js, Strapi, PostgreSQL, Meilisearch, Nginx, Docker.

## Инструкция 📖
- Настройте переменные окружения в папке `docker`.
- Запустите dev-окружение и сконфигурируйте Strapi.
- Добавьте полученный админский токен Strapi в env (frontend забирает его из переменных).
- Пропишите учётные данные Meilisearch в env и в конфиге плагина Strapi (см. `docker/.env.*`).
- Подготовьте реквизиты S3/Beget: заполните `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_FORCE_PATH_STYLE`, `S3_CDN_BASE_URL`, `NEXT_PUBLIC_ASSET_HOST`.
- На проде поправьте конфигурацию nginx под свой домен и актуализируйте переменные окружения.
- Выпустите SSL-сертификат для сервера через certbot.

## Docker 🐳

#### Запуск контейнеров для разработки
```
docker compose -f development.compose.yml --env-file .env.development up --build
```
или
```
./compose.sh development up --build
```

#### Запуск контейнеров для продакшена
```
docker compose -f production.compose.yml --env-file .env.production up -d --build
```
или
```
./compose.sh production up -d --build
```

#### Остановка контейнеров
```
docker compose -f *.compose.yml down
```
или
```
./compose.sh * down
```

## Meilisearch 🔍
- Базовый адрес контейнера: `http://meilisearch:7700`.
- Master key передаётся через `MEILISEARCH_MASTER_KEY` в `docker/.env.*` и используется в Strapi.
- Фронтенд ждёт search-only key, прокинутый в `NEXT_PUBLIC_MEILISEARCH_API_KEY`.
- Интеграция выполнена через `strapi-plugin-meilisearch`; расширенные правила индексации настраиваются в конфиге плагина.

## Strapi 🛠️
### Медиа через S3 (Beget/MinIO)
- Провайдер загрузки: пакет `@strapi/provider-upload-aws-s3`, идентификатор `aws-s3`. Конфигурация лежит в `strapi/config/plugins.ts` и использует `S3_FORCE_PATH_STYLE` для MinIO.
- Dev-окружение: MinIO (`docker/development.compose.yml`) с портами `9000/9001`; root-пользователь и пароль совпадают с `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`.
- Production: `docker/production.compose.yml` прокидывает тот же набор переменных и ждёт боевые значения (`S3_ENDPOINT`, `S3_REGION`, `S3_CDN_BASE_URL`, `S3_FORCE_PATH_STYLE=false`).
- Фронтенд читает `NEXT_PUBLIC_ASSET_HOST` и разрешает CDN-домен/порт в `next/image`.
- Регламент Beget CDN: создайте бакет, подключите CDN-ресурс, настройте CNAME на публичный URL бакета, включите CORS для `https://marcus.example`, задайте TTL/Cache-Control. Значение `S3_CDN_BASE_URL` должно совпадать с CDN-доменом; в dev держим `S3_FORCE_PATH_STYLE=true`.

### REST Cache на Redis ⚡
- Env: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TLS`, `REDIS_CACHE_DB`, `REDIS_CACHE_PREFIX`, `REDIS_CACHE_TTL`, `REDIS_CACHE_CONTENT_TYPES`.
- Кеш реализован через `@strapi-community/plugin-rest-cache` с провайдером Redis: ключи собираются с префиксом из `REDIS_CACHE_PREFIX`, TTL задаётся `REDIS_CACHE_TTL`.
- Список коллекций можно переопределить в `REDIS_CACHE_CONTENT_TYPES` (по умолчанию подключены витринные сущности каталога).
- Очистка кеша: `pnpm --filter strapi strapi console` → `strapi.plugin('rest-cache').service('cacheManager').clear()`.
- Подробнее: [Strapi REST Cache + Redis](https://strapi-community.github.io/plugin-rest-cache/providers/redis).

#### Экспорт данных без шифрования и сжатия
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

#### Импорт данных
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
#### Получение SSL-сертификата
```
docker compose -f production.compose.yml run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot/ \
  -d vpsmarcus.itts.su \
  -d www.vpsmarcus.itts.su \
  -d api.vpsmarcus.itts.su \
  -d cms.vpsmarcus.itts.su
```

Сертификаты для всех SAN-доменов будут в `certbot/conf/live/vpsmarcus.itts.su/`. После получения перезапустите `nginx`, чтобы он подхватил новые файлы.
