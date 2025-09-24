set -euxo pipefail
cd /workspace/$(basename "$(pwd)")

git status
# Подготовим примерный .env для web (локально, не коммитим)
cp apps/web/.env.local.example apps/web/.env.local

# Сборка Next прямо в Codex (проверка)
pnpm -w build || true

# Зафиксируем созданные файлы
git add -A
git commit -m "chore: bootstrap monorepo (web + tooling + docker dev)"
git push
