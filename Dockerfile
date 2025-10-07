# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Usa lockfile se existir (mais rápido e reprodutível)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Somente variáveis públicas podem entrar em build:
ARG NEXT_PUBLIC_META_APP_ID
ENV NEXT_PUBLIC_META_APP_ID=${NEXT_PUBLIC_META_APP_ID}

# Gera o bundle de produção (standalone)
RUN npm install

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia servidor standalone e assets estáticos
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
