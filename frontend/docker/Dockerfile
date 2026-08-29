FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build


FROM nginxinc/nginx-unprivileged:alpine AS runtime

COPY --chown=nginx:nginx docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=5s \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/health || exit 1
