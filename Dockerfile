# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# A variável pode ser passada como build-arg pelo Easypanel
ARG VITE_API_URL=https://api.pgl-m.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copia build gerado na raiz e também em /adf/ para compatibilidade com proxy reverso
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/dist /usr/share/nginx/html/adf

# Config nginx: serve na raiz e em /adf/ com SPA fallback
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
