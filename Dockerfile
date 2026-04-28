# STAGE 1: Dependencies Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for optimal layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Run linting (optional, for quality checks)
RUN npm run lint 2>/dev/null || echo "Linting skipped"

# STAGE 2: Production Runtime
FROM node:18-alpine AS runtime

# Metadata labels
LABEL maintainer="devops@sokogate.com"
LABEL org.opencontainers.image.source="https://github.com/sokogate/sokogate-calc"
LABEL org.opencontainers.image.description="Sokogate Construction Materials Calculator"
LABEL org.opencontainers.image.licenses="MIT"

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/app.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/views ./views
COPY --from=builder /app/healthcheck.js ./

# Create logs directory and set proper permissions
RUN mkdir -p logs && \
    chown -R appuser:nodejs /app && \
    chmod -R 755 logs

# Switch to non-root user for security
USER appuser

# Environment variables (defaults, override via docker-compose/CI)
ENV NODE_ENV=production
ENV PORT=3000
ENV BASE_PATH=/Calculate

# Expose application port
EXPOSE 3000

# Health check to verify container is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application
CMD ["node", "app.js"]