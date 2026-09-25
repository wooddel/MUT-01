# ==============================================================================
# Security-Hardened Multi-Stage Dockerfile for MUT House Hunter
# Prevents unauthorized access, hides server headers, and runs non-root container
# ==============================================================================

FROM nginx:1.25-alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy website application files into Nginx document root
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/

# Copy custom security-hardened Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set strict permissions and ownership for static files
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx

# Run container as non-root unprivileged user for anti-hacking security
USER nginx

# Expose HTTP port 8080 (non-root standard)
EXPOSE 8080

# Healthcheck to verify server container status
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
