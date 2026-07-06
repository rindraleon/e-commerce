FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_API_PREFIX=
ARG VITE_SITE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_PREFIX=$VITE_API_PREFIX
ENV VITE_SITE_URL=$VITE_SITE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=80
ENV VITE_API_BASE_URL=/api
ENV VITE_API_PREFIX=
ENV VITE_SITE_URL=http://localhost:8080
ENV BACKEND_UPSTREAM_SCHEME=http
ENV BACKEND_UPSTREAM_HOSTPORT=backend:3000

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/40-generate-app-config.sh /docker-entrypoint.d/40-generate-app-config.sh
RUN chmod +x /docker-entrypoint.d/40-generate-app-config.sh
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
