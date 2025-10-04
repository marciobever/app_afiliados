# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Dependências primeiro (cache melhor)
COPY package*.json ./
RUN npm ci

# Código
COPY . .

# Build Next.js em modo standalone
ENV NODE_ENV=production
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia o bundle standalone gerado pelo Next
# Ele já inclui node_modules e server.js
COPY --from=build /app/.next/standalone ./
# Assets estáticos
COPY --from=build /app/.next/static ./.next/static
# (Só copie /public se ele existir no repo. Se não existir, deixe de fora)
# COPY --from=build /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
