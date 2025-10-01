# Проектирование интернет-магазина Marcus (Next.js + Strapi)

## Фактический срез архитектуры (январь 2025)

Проект развёрнут как headless-решение с помощью Docker Compose. В стеке
используются пять сервисов:

- **frontend** — Next.js 15.5.3 (App Router, React 19.1) со стандартной
  страницей-примером; контейнер собирается из `frontend` каталога и
  проксируется наружу на порт 3000 в dev-сборке.【F:docker/development.compose.yml†L5-L23】【F:frontend/package.json†L1-L22】【F:frontend/src/app/page.tsx†L1-L72】
- **strapi** — Strapi 5.23.6 с подключённым `strapi-plugin-meilisearch`;
  при сборке монтируются каталоги `config`, `database`, `public` и `src`.
  Приложение работает на Node.js 18+ и обменивается данными с Postgres по
  порту 1337.【F:docker/development.compose.yml†L25-L55】【F:strapi/package.json†L1-L37】
- **database** — PostgreSQL 14 в официальном образе `postgres:14-alpine`
  с персистентным томом `postgresql_database`. В production-версии
  используется том `postgres-data`. В проекте нет дополнительных брокеров
  (Redis) или очередей.【F:docker/development.compose.yml†L57-L69】【F:docker/production.compose.yml†L68-L96】
- **meilisearch** — Meilisearch v1.7, доступный по порту 7700. Пара ключей
  (`MEILISEARCH_HOST` и `MEILISEARCH_MASTER_KEY`) прокидывается и во
  frontend, и в Strapi. Дополнительные настройки индексов пока не
  прописаны.【F:docker/development.compose.yml†L71-L90】【F:strapi/config/plugins.ts†L1-L17】
- **nginx/certbot** — подключаются только в production-сборке. Nginx
  выступает reverse-proxy для frontend (`/` и статика) и Strapi (`/` на
  поддомене api/cms) и раздаёт сертификаты из `certbot`. Настройки
  предусматривают принудительный HTTPS и кеширование статики Next.js, но
  дополнительных балансировщиков или CDN в конфигурации нет.【F:docker/production.compose.yml†L5-L67】【F:nginx/default.conf†L1-L83】

Все сервисы объединены в одну сеть `internal`. В dev-конфигурации прямого
внешнего прокси нет — Next.js и Strapi слушают порты на хосте. Production
скрывает сервисы за Nginx; Certbot используется вручную для выпуска
сертификатов (команда приведена в `README.md`).【F:docker/development.compose.yml†L5-L90】【F:docker/production.compose.yml†L5-L119】

## Потоки данных

1. Клиентские запросы попадают на Nginx (production) или напрямую на
   контейнер `frontend` (development). Next.js отрисовывает App Router
   страницу и при необходимости обращается к Strapi через REST API.
2. Strapi взаимодействует с PostgreSQL при помощи драйвера `pg`.
   Конфигурация базы задаётся через переменные окружения либо SQLite по
   умолчанию, если Postgres недоступен, однако в docker-сборках всегда
   используется Postgres.【F:strapi/package.json†L11-L19】【F:strapi/config/database.ts†L1-L46】
3. Плагин `strapi-plugin-meilisearch` активируется только при наличии
   переменных окружения. Он подключён, но индексация ещё не настроена —
   нет типов контента и схем синхронизации. Параметры поиска на стороне
   фронтенда также не используются, поскольку в приложении отсутствуют
   вызовы Meilisearch SDK или API.【F:strapi/config/plugins.ts†L1-L17】【F:frontend/src/app/page.tsx†L1-L72】
4. Загрузка файлов Strapi работает через локальный провайдер (`public/uploads`).
   В docker-compose нет ни S3, ни CDN. Это значит, что в production-флоу
   файлы должны храниться на томе Strapi и проксироваться через Nginx.

## Фронтенд (Next.js)

- App Router без кастомных маршрутов: присутствует только `app/page.tsx`
  и `layout.tsx`; страница — стандартный create-next-app boilerplate.
- Конфигурация `next.config.ts` не содержит SSR/ISR триггеров, а
  `package.json` включает только базовые скрипты (`dev`, `build`,
  `start`, `lint`). Дополнительные библиотеки (UI, стейт-менеджмент,
  аналитика) отсутствуют.【F:frontend/src/app/page.tsx†L1-L72】【F:frontend/package.json†L5-L20】
- Переменные окружения для API (`API_CONTAINER_URL`, `API_CLIENT_URL`,
  `API_TOKEN`) и Meilisearch пробрасываются, но в коде пока не читаются.
  Это следует учесть перед интеграцией реального каталога.【F:docker/development.compose.yml†L11-L18】

## CMS (Strapi)

- В `src/api` нет типов контента; проект находится в состоянии «пустой
  Strapi после инициализации». Это означает, что схемы каталога, импорты
  и webhooks ещё не реализованы.【F:strapi/src/api/.gitkeep†L1-L1】
- Конфигурация базы допускает переключение между SQLite (по умолчанию) и
  Postgres через переменные окружения. В docker окружении всегда
  используется Postgres, поэтому стоит убрать SQLite, когда появятся
  миграции для продуктивной базы.【F:strapi/config/database.ts†L3-L46】
- Плагины ограничены стандартным `plugin-cloud`, `users-permissions` и
  `strapi-plugin-meilisearch`. Кастомных расширений нет, админка работает
  на дефолтном шаблоне.【F:strapi/package.json†L11-L24】

## Поиск

- Плагин Meilisearch подключён, но без конфигурации индексов.
- Docker поднимает отдельный контейнер с томом `meilisearch_data`, однако
  никаких задач по синхронизации или пересборке индексов не настроено.
  Следующий шаг — определить стратегии индексации после появления типов
  контента.【F:docker/development.compose.yml†L71-L90】

## Инфраструктура и деплой

- Для разработки и production используются отдельные compose-файлы.
  Production добавляет Nginx и Certbot, остальные сервисы идентичны.
- Скрипт `docker/compose.sh` упрощает запуск разных конфигураций, но CI/CD
  в репозитории не описан.
- Certbot выпускает сертификаты вручную через команду, указанную в
  `README.md`; автоматизации продления нет.【F:docker/compose.sh†L1-L74】【F:README.md†L19-L55】

## Ограничения и дальнейшие шаги

- В текущем состоянии отсутствуют ключевые сущности: модели продуктов,
  категории, импорт данных, корзина и любые бизнес-процессы, перечисленные
  в ТЗ. Эти элементы необходимо спроектировать и реализовать до начала
  наполнения контента.
- Нет интеграции с Oasis Catalog, внешними платёжными сервисами,
  виджетами доставки или аналитикой. Все эти элементы остаются в бэклоге.
- Для production-окружения нужно решить вопрос хранения медиа: локальный
  диск Strapi не подходит для горизонтального масштабирования или CDN.
- Следует запланировать системы кеширования и очередей, если они требуются
  по ТЗ. Пока стек ограничен Postgres и Meilisearch.
