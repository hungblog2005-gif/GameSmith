FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
# Install production dependencies only (no devDeps)
RUN npm ci --omit=dev --silent

# Writable uploads dir owned by the app user
RUN mkdir -p uploads && chown -R appuser:appgroup uploads

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null 'http://localhost:3000/assets/featured?limit=1' || exit 1

CMD ["node", "dist/main.js"]
