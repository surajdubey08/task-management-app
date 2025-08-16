# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
# Use npm install to handle version conflicts gracefully
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Create a non-root user for nginx
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G appuser -g appuser appuser

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
    chown -R appuser:appuser /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html

# Create nginx.pid file with proper permissions
RUN touch /var/run/nginx.pid && \
    chown appuser:appuser /var/run/nginx.pid

# Copy custom nginx config (Docker Compose version)
COPY nginx-docker.conf /etc/nginx/conf.d/default.conf
RUN chown appuser:appuser /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html
RUN chown -R appuser:appuser /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Expose port (using 8080 for non-root)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
