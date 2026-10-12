# Next.js app (public website or admin dashboard).
# Build context: repository root.
#   docker build -f infra/docker/next.Dockerfile --build-arg APP=web   -t withaq/web .
#   docker build -f infra/docker/next.Dockerfile --build-arg APP=admin --build-arg API_ORIGIN=http://api-nginx -t withaq/admin .
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS build
ARG APP
ARG API_ORIGIN=""
ARG NEXT_PUBLIC_DEMO_MODE=false
ENV NEXT_TELEMETRY_DISABLED=1 API_ORIGIN=${API_ORIGIN} NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE}
WORKDIR /app
COPY apps/${APP}/package.json apps/${APP}/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/${APP}/ ./
RUN npm run build && npm prune --omit=dev

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.ts ./
USER node
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
