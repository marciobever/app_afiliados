# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# Dependências primeiro (cache melhor)
COPY package*.json ./
RUN npm run build

# Código
COPY . .

# 🔧 Variáveis de ambiente necessárias no build
ARG SUPABASE_URL
ARG SUPABASE_SERVICE_ROLE_KEY
ARG N8N_BASE_URL
ARG META_REDIRECT_URI
ARG NEXT_PUBLIC_META_APP_ID

ENV NODE_ENV=production \
    SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    N8N_BASE_URL=$N8N_BASE_URL \
    META_REDIRECT_URI=$META_REDIRECT_URI \
    NEXT_PUBLIC_META_APP_ID=$NEXT_PUBLIC_META_APP_ID

# 🔨 Build Next.js em modo standalone
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Usuário não-root
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia o bundle standalone gerado pelo Next
COPY --from=build /app/.next/standalone ./
# Assets estáticos
COPY --from=build /app/.next/static ./.next/static
# (Copie o /public se existir)
# COPY --from=build /app/public ./public

USER nextjs
EXPOSE 3000

# 🚀 Inicia o servidor Next.js standalone
CMD ["node", "server.js"]
