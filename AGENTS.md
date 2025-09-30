# AGENTS
## Lint
- pnpm -w lint
## Typecheck
- pnpm -w typecheck
## Build
- pnpm -w build
## Dev
- docker compose -f docker-compose.dev.yml up --build *(web + cms + db + meili)*

## Документация (обязательно к использованию)

### Внутренние документы (источник истины)
- `docs/Утверждённое с заказчиком ТЗ.md`
- `docs/Проектирование интернет-магазина Marcus (Next.js + Strapi).md`
- `docs/Результаты и демонстрация по этапам.md`

**Правила:**
- Приоритет: внутренние документы > внешние источники.
- Любое расхождение фиксируем в `docs/DECISIONS.md` (создать при первом кейсе), ссылкой на пункт исходного документа.
- В каждой задаче/PR включать раздел **References** с точными ссылками на раздел/страницу/рисунок (если применимо).

### Внешняя документация (официальные источники)
- Next.js (App Router, SSR/ISR/SSG): https://nextjs.org/docs
- Strapi v5 (CMS, Content Types, Plugins): https://docs.strapi.io/
- Meilisearch (search, facets, typo tolerance):
  - https://www.meilisearch.com/docs/learn/relevancy/typo_tolerance_settings
  - https://www.meilisearch.com/docs/reference/api/facet_search
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui (компоненты на базе Radix + Tailwind): https://ui.shadcn.com/docs
- Radix UI (a11y-примитивы): https://www.radix-ui.com/primitives
- Docker Compose (Ubuntu, плагин): https://docs.docker.com/compose/install/linux/
- GitHub Actions (workflow syntax): https://docs.github.com/en/actions/reference/workflows-and-actions
- GA4 e-commerce события (gtag/GTM): https://developers.google.com/analytics/devguides/collection/ga4/ecommerce

### Как ссылаться в задачах
В описании задачи (или в PR) добавляй блок:

**References**
- Internal: `<файл и раздел>` (например: `docs/Утверждённое с заказчиком ТЗ.md → §3.2.1 Каталог → фильтры`)
- External: `<Название> — <URL>` (только из списка выше)

**Definition of Done (для задач, затрагивающих поведение/схемы):**
- Указаны ссылки на внутренние разделы.
- Если приняты отступления от ТЗ/доков — запись в `docs/DECISIONS.md`.
- Для API/поиска/рендера — приложены выдержки из внешней доки, на которую опирались.
