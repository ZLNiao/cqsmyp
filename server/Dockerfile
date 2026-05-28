# 多阶段构建：deps → runner
FROM node:20-alpine AS deps
WORKDIR /app
# sharp 需要的系统依赖
RUN apk add --no-cache vips-dev python3 make g++
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 运行时需要 vips
RUN apk add --no-cache vips
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O- http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
