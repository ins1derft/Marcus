# 1) build Strapi with pnpm workspace tooling
FROM node:22-alpine AS build
WORKDIR /repo
RUN apk add --no-cache bash python3 make g++ libc6-compat \
  && corepack enable \
  && corepack prepare pnpm@9.12.3 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps ./apps
RUN pnpm install --filter cms... --frozen-lockfile
RUN pnpm --filter cms build
RUN pnpm deploy --filter cms --prod /opt/strapi

# 2) runtime image
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat \
  && corepack enable \
  && corepack prepare pnpm@9.12.3 --activate
ENV NODE_ENV=production
COPY --from=build /opt/strapi ./
EXPOSE 1337
CMD ["pnpm", "start"]
