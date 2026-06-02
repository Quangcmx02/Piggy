# PiggyFE/Dockerfile
# ===== Stage 1: Build React =====
FROM node:20-alpine AS builder
WORKDIR /app

# Cache npm dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source và build
# .env.production sẽ được dùng tự động bởi Vite
COPY . .
RUN npm run build

# ===== Stage 2: Serve =====
FROM nginx:alpine
# Copy FE static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config mount từ docker-compose (volume), không COPY cứng
# Để có thể override config mà không rebuild image
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
