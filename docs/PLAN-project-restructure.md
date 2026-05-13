# PLAN: Project Restructure v2 — Local Dev, Ngrok & VPS Deploy

> **Updated:** 2026-05-13 v3 (hotfix) | **Agent:** project-planner

---

## 🎯 Mục tiêu (Updated)

| Goal | Mô tả |
|------|-------|
| ✅ nginx.conf ở `infrastructure/nginx/` | Nginx biết về BE Gateway — không thuộc FE |
| ✅ Docker Compose dùng `include:` | Tách file theo layer, không lặp config |
| ✅ Dockerfile tự build JAR | Multi-stage Maven — không cần JAR sẵn |
| ✅ FE build image riêng | Node build → nginx:alpine |
| ✅ Local = IntelliJ + npm run dev | Docker chỉ chạy infra (MySQL, Consul, RabbitMQ) |
| ✅ VPS = Docker full + ngrok public | ngrok expose port 80 ra internet |

---

## 🏗️ Cấu trúc thư mục mục tiêu

```
Piggy/                                  ← Monorepo root
├── .env                                ← Shared env (gitignored)
├── .env.example                        ← Template (committed)
├── .gitignore
│
├── infrastructure/                     ← Tất cả hạ tầng tập trung
│   ├── nginx/
│   │   └── default.conf               ← Nginx proxy (biết về BE gateway)
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── docker/
│       ├── docker-compose.infra.yml   ← MySQL, Consul, RabbitMQ
│       ├── docker-compose.services.yml← BE microservices
│       ├── docker-compose.fe.yml      ← FE nginx container
│       ├── docker-compose.monitor.yml ← Prometheus, Grafana
│       └── docker-compose.yml         ← ROOT: include tất cả
│
├── scripts/
│   ├── dev-start.ps1                  ← Khởi động local dev (infra only)
│   ├── ngrok-update.ps1               ← Cập nhật CORS khi ngrok URL đổi
│   └── vps-deploy.sh                  ← Deploy script cho VPS
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── PiggyFE/
│   ├── Dockerfile                     ← Multi-stage: Node build → nginx
│   ├── .env.development               ← VITE_API_BASE_URL=http://localhost:8080/api
│   ├── .env.production                ← VITE_API_BASE_URL=/api
│   ├── vite.config.ts                 ← Thêm dev proxy → localhost:8080
│   └── src/
│
└── PiggyBE/
    ├── pom.xml                        ← Parent POM
    ├── common-lib/
    ├── api-gateway/
    │   ├── Dockerfile                 ← Multi-stage Maven (tự build JAR)
    │   └── src/
    ├── identity-service/
    │   ├── Dockerfile
    │   └── src/
    ├── transaction-service/
    │   ├── Dockerfile
    │   └── src/
    └── notification-service/
        ├── Dockerfile
        └── src/
```

---

## 🔄 Workflow theo môi trường

| Môi trường | BE chạy thế nào | FE chạy thế nào | Ngrok |
|-----------|-----------------|-----------------|-------|
| **Local Dev** | IntelliJ (run trực tiếp) | `npm run dev` (port 5173) | Không |
| **Local Docker** | `docker-compose up services` | `docker-compose up fe` (port 80) | Không |
| **VPS + Ngrok** | `docker-compose up` (full) | `docker-compose up fe` (port 80) | `ngrok http 80` |

### Local Dev Flow (chính)

```
[Docker] MySQL + Consul + RabbitMQ   ← chỉ chạy infra
[IntelliJ] Run từng Spring Boot service
[VS Code] npm run dev → Vite proxy → localhost:8080 (gateway)
```

**Vite proxy** xử lý `/api` → gateway khi dev, **không cần** sửa code khi deploy.

### VPS + Ngrok Flow

```
[VPS] docker-compose up (full stack trên port 80)
[VPS] ngrok http 80  →  https://xxxx.ngrok-free.app
[Script] ngrok-update.ps1 → update ALLOWED_ORIGINS trong .env → restart gateway
```

---

## 📋 Phase Breakdown

### Phase 1 — Tái cấu trúc thư mục

| Task | Action | Priority |
|------|--------|----------|
| 1.1 | Tạo thư mục `infrastructure/nginx/`, `infrastructure/prometheus/`, `infrastructure/docker/` | 🔴 P0 |
| 1.2 | Di chuyển + sửa `nginx.conf` → `infrastructure/nginx/default.conf` | 🔴 P0 |
| 1.3 | Di chuyển `prometheus.yml` → `infrastructure/prometheus/prometheus.yml` | 🟡 P1 |
| 1.4 | Di chuyển `docker-compose.yml` → tách thành 4 file trong `infrastructure/docker/` | 🔴 P0 |
| 1.5 | Di chuyển `PiggyBE/.env` → `Piggy/.env` | 🔴 P0 |
| 1.6 | Xóa `hs_err_pid*.log`, JAR files rác trong `PiggyBE/` | 🟢 P2 |
| 1.7 | Tạo root `.gitignore` | 🟡 P1 |

### Phase 2 — Nginx config (infrastructure/nginx/default.conf)

> Nginx là **reverse proxy trung tâm** — biết về cả FE static files và BE gateway.
> Đặt trong `infrastructure/nginx/` để rõ ràng đây là infra concern, không phải FE concern.

```nginx
server {
    listen 80;
    server_name _;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Static FE files
    location / {
        root   /usr/share/nginx/html;
        index  index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API → API Gateway (BE)
    # piggy-gateway là tên container trong Docker network
    #
    # ⚠️ FIX B — Tránh double-prefix /api/api:
    # location /api/ → nginx strip trailing slash rồi pass → gateway nhận /api/...
    # Nếu proxy_pass có /api/ ở cuối = gateway nhận /api/api/... → 404!
    # Rule: proxy_pass KHÔNG có trailing path nếu gateway đã tự handle /api prefix.
    location /api/ {
        proxy_pass         http://piggy-gateway:8080;   # ← KHÔNG thêm /api/ ở đây
        proxy_http_version 1.1;
        proxy_set_header   Host              $http_host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        # Bypass ngrok browser warning khi test
        proxy_set_header   ngrok-skip-browser-warning true;
        proxy_read_timeout 60s;
    }
}
```

### Phase 3 — Dockerfile BE (Multi-stage tự build JAR)

> ⚠️ **FIX A — Build context = root `Piggy/`** — Docker phải thấy được `PiggyBE/pom.xml` và `common-lib/`.
>
> **Lệnh build ĐÚNG** (luôn chạy từ thư mục gốc `Piggy/`):
> ```powershell
> # Đứng tại Piggy/ (root), không phải trong PiggyBE/identity-service/
> docker build -f PiggyBE/identity-service/Dockerfile .
> #                                                    ^ dấu chấm = root context
> ```
> Nếu chạy từ trong service folder → Docker không thấy `common-lib` → build FAIL.

**Template cho mỗi service** (`PiggyBE/{service}/Dockerfile`):

```dockerfile
# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Copy parent POM + common-lib trước để cache layer dependency
COPY PiggyBE/pom.xml ./pom.xml
COPY PiggyBE/common-lib ./common-lib

# Copy source của service cần build
COPY PiggyBE/{SERVICE_NAME} ./{SERVICE_NAME}

# Build chỉ service này (-pl) và dependency của nó (-am)
RUN mvn -pl {SERVICE_NAME} -am \
    package -DskipTests -q \
    -Dmaven.repo.local=/root/.m2/repository

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo non-root user
RUN addgroup -S piggy && adduser -S piggy -G piggy
USER piggy

COPY --from=builder /workspace/{SERVICE_NAME}/target/*.jar app.jar

EXPOSE {PORT}
ENTRYPOINT ["java", "-Xms128m", "-Xmx256m", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", "app.jar"]
```

**Các service cần tạo:**

| Service | PORT | Dockerfile |
|---------|------|-----------|
| api-gateway | 8080 | `PiggyBE/api-gateway/Dockerfile` |
| identity-service | 8081 | `PiggyBE/identity-service/Dockerfile` |
| transaction-service | 8082 | `PiggyBE/transaction-service/Dockerfile` |
| notification-service | 8083 | `PiggyBE/notification-service/Dockerfile` |

### Phase 4 — Dockerfile FE (Multi-stage Node → Nginx)

```dockerfile
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
```

> 💡 **Tại sao không COPY nginx.conf trong Dockerfile FE?**
> Nginx config được **mount qua volume** trong docker-compose, vì config biết về `piggy-gateway` (BE concern). Nếu COPY vào image FE sẽ làm FE image phụ thuộc vào BE topology.

### Phase 5 — Docker Compose với `include:`

Docker Compose v2.20+ hỗ trợ `include:` — mỗi file compose chỉ chứa một nhóm concern.

**`infrastructure/docker/docker-compose.yml`** (ROOT — entry point):

```yaml
# Compose v2 format — không cần 'version' field
# Entry point — include tất cả layer

include:
  - docker-compose.infra.yml
  - docker-compose.services.yml
  - docker-compose.fe.yml
  - docker-compose.monitor.yml
```

**`infrastructure/docker/docker-compose.infra.yml`**:

```yaml
x-logging: &logging
  driver: json-file
  options: { max-size: "10m", max-file: "3" }

services:
  mysql:
    image: mysql:8.0
    container_name: piggy-mysql
    ports: ["3306:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    logging: *logging
    restart: unless-stopped

  consul:
    image: hashicorp/consul:latest
    container_name: piggy-consul
    ports: ["8500:8500"]
    command: "agent -dev -client 0.0.0.0"
    logging: *logging
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: piggy-rabbitmq
    ports: ["5672:5672", "15672:15672"]
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBIT_USER:-guest}
      RABBITMQ_DEFAULT_PASS: ${RABBIT_PASS:-guest}
    logging: *logging
    restart: unless-stopped

volumes:
  mysql_data:
```

**`infrastructure/docker/docker-compose.services.yml`**:

```yaml
# Build context = Piggy/ root (2 levels up từ infrastructure/docker/)
x-be-common: &be-common
  restart: unless-stopped
  extra_hosts:
    - "host.docker.internal:host-gateway"

services:
  api-gateway:
    <<: *be-common
    build:
      context: ../..         # Root Piggy/
      dockerfile: PiggyBE/api-gateway/Dockerfile
    container_name: piggy-gateway
    ports: ["8080:8080"]
    environment:
      SPRING_CLOUD_CONSUL_HOST: piggy-consul
      SPRING_CLOUD_CONSUL_PORT: 8500
      SPRING_CLOUD_GATEWAY_SERVER_WEBFLUX_GLOBALCORS_CORS_CONFIGURATIONS_ALL_ALLOWEDORIGINPATTERNS: ${ALLOWED_ORIGINS}
      SPRING_CLOUD_GATEWAY_SERVER_WEBFLUX_GLOBALCORS_CORS_CONFIGURATIONS_ALL_ALLOWEDMETHODS: "*"
      SPRING_CLOUD_GATEWAY_SERVER_WEBFLUX_GLOBALCORS_CORS_CONFIGURATIONS_ALL_ALLOWEDHEADERS: "*"
      SPRING_CLOUD_GATEWAY_SERVER_WEBFLUX_GLOBALCORS_CORS_CONFIGURATIONS_ALL_ALLOWCREDENTIALS: "true"
    depends_on: [consul]

  identity-service:
    <<: *be-common
    build:
      context: ../..
      dockerfile: PiggyBE/identity-service/Dockerfile
    container_name: piggy-identity
    ports: ["8081:8081"]
    environment:
      SPRING_CLOUD_CONSUL_HOST: piggy-consul
      # ⚠️ FIX C — Consul discovery IP:
      # - Local Docker: dùng tên container "piggy-identity" (bridge network hoạt động)
      # - VPS network_mode:host: container name KHÔNG resolve được → phải dùng 127.0.0.1
      # → Giải pháp: đặt biến này trong .env.local / .env.vps, KHÔNG hardcode
      SPRING_CLOUD_CONSUL_DISCOVERY_IP_ADDRESS: ${IDENTITY_DISCOVERY_IP:-piggy-identity}
      SPRING_DATASOURCE_URL: "jdbc:mysql://piggy-mysql:3306/piggy_identity?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
    depends_on: [mysql, consul]

  transaction-service:
    <<: *be-common
    build:
      context: ../..
      dockerfile: PiggyBE/transaction-service/Dockerfile
    container_name: piggy-transaction
    ports: ["8082:8082"]
    environment:
      SPRING_CLOUD_CONSUL_HOST: piggy-consul
      # ⚠️ FIX C — Same as identity-service
      SPRING_CLOUD_CONSUL_DISCOVERY_IP_ADDRESS: ${TRANSACTION_DISCOVERY_IP:-piggy-transaction}
      SPRING_DATASOURCE_URL: "jdbc:mysql://piggy-mysql:3306/db_transaction?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
    depends_on: [mysql, consul]

  notification-service:
    <<: *be-common
    build:
      context: ../..
      dockerfile: PiggyBE/notification-service/Dockerfile
    container_name: piggy-notification
    ports: ["8083:8083"]
    environment:
      SPRING_CLOUD_CONSUL_HOST: piggy-consul
      SPRING_RABBITMQ_HOST: piggy-rabbitmq
      SPRING_RABBITMQ_USERNAME: ${RABBIT_USER:-guest}
      SPRING_RABBITMQ_PASSWORD: ${RABBIT_PASS:-guest}
    depends_on: [rabbitmq, consul]
```

**`infrastructure/docker/docker-compose.fe.yml`**:

```yaml
services:
  frontend:
    build:
      context: ../../PiggyFE    # PiggyFE folder
      dockerfile: Dockerfile
    container_name: piggy-frontend
    ports: ["80:80"]
    volumes:
      # Mount nginx config từ infrastructure — FE image không biết về BE
      - ../nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [api-gateway]
    restart: unless-stopped
```

**`infrastructure/docker/docker-compose.monitor.yml`**:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: piggy-prometheus
    ports: ["9090:9090"]
    volumes:
      - ../prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: piggy-grafana
    ports: ["3001:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana_data:
```

### Phase 6 — .env Strategy

**`Piggy/.env.example`** (committed to git):

```bash
# === DATABASE ===
DB_PASSWORD=change_me_strong_password

# === MESSAGE BROKER ===
RABBIT_USER=guest
RABBIT_PASS=guest

# === CORS — URL FE truy cập (local dev = localhost:5173) ===
ALLOWED_ORIGINS=http://localhost:5173

# === MONITORING ===
GRAFANA_PASSWORD=admin

# === FIX C — Consul Discovery IP (override theo môi trường) ===
# Local Docker (bridge network): dùng tên container
IDENTITY_DISCOVERY_IP=piggy-identity
TRANSACTION_DISCOVERY_IP=piggy-transaction
NOTIFICATION_DISCOVERY_IP=piggy-notification
```

**`Piggy/.env.local`** (local Docker — bridge network, tên container hoạt động):

```bash
# Consul discovery dùng tên container (bridge network)
IDENTITY_DISCOVERY_IP=piggy-identity
TRANSACTION_DISCOVERY_IP=piggy-transaction
NOTIFICATION_DISCOVERY_IP=piggy-notification
```

**`Piggy/.env.vps`** (VPS — nếu dùng `network_mode: host`):

```bash
# ⚠️ FIX C: network_mode:host → container name không resolve → phải dùng 127.0.0.1
IDENTITY_DISCOVERY_IP=127.0.0.1
TRANSACTION_DISCOVERY_IP=127.0.0.1
NOTIFICATION_DISCOVERY_IP=127.0.0.1
```

> 💡 Khi deploy VPS: `cp .env.vps .env` trước khi `docker-compose up`.

**`PiggyFE/.env.development`** (local `npm run dev`):

```bash
# Vite proxy sẽ forward /api → localhost:8080
# Biến này dùng khi KHÔNG có proxy (fallback)
VITE_API_BASE_URL=http://localhost:8080/api
```

**`PiggyFE/.env.production`** (Docker image build — relative path):

```bash
# Relative path → nginx reverse proxy handle
VITE_API_BASE_URL=/api
```

**`PiggyFE/vite.config.ts`** (thêm dev server proxy):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Khi npm run dev, /api → IntelliJ Spring Boot gateway
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Không rewrite path — gateway expect /api prefix
      }
    }
  }
})
```

### Phase 7 — Scripts

**`scripts/dev-start.ps1`** (Local dev: chỉ khởi động infra):

```powershell
# Khởi động chỉ infra cho local dev với IntelliJ
Write-Host "🚀 Starting Piggy infrastructure..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot/.."

docker-compose -f infrastructure/docker/docker-compose.infra.yml up -d

Write-Host "✅ Infrastructure ready:" -ForegroundColor Green
Write-Host "  MySQL:    localhost:3306"
Write-Host "  Consul:   http://localhost:8500"
Write-Host "  RabbitMQ: http://localhost:15672"
Write-Host ""
Write-Host "Now run services in IntelliJ, then: cd PiggyFE && npm run dev"
```

**`scripts/ngrok-update.ps1`** (Update CORS khi ngrok URL thay đổi):

```powershell
param([string]$NgrokUrl = "")

# Nếu không truyền URL, tự detect từ ngrok API
if (-not $NgrokUrl) {
    try {
        $NgrokUrl = (Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels[0].public_url
    } catch {
        Write-Error "Ngrok chưa chạy. Hãy chạy 'ngrok http 80' trước."
        exit 1
    }
}

Write-Host "Ngrok URL: $NgrokUrl" -ForegroundColor Cyan

# Đọc .env hiện tại và cập nhật ALLOWED_ORIGINS
$envPath = "$PSScriptRoot/../.env"
$content = Get-Content $envPath
$content = $content -replace "^ALLOWED_ORIGINS=.*", "ALLOWED_ORIGINS=$NgrokUrl"
$content | Set-Content $envPath

# Restart chỉ api-gateway để apply CORS mới
docker-compose -f infrastructure/docker/docker-compose.services.yml \
    up -d api-gateway --force-recreate

Write-Host "✅ CORS updated! Share: $NgrokUrl" -ForegroundColor Green
```

### Phase 8 — CI/CD GitHub Actions

**`.github/workflows/ci.yml`**:

```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  build-be:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven
      - name: Build all BE modules
        run: cd PiggyBE && mvn package -DskipTests -q

  build-fe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: PiggyFE/package-lock.json
      - name: Install & Build FE
        run: cd PiggyFE && npm ci --legacy-peer-deps && npm run build
```

**`.github/workflows/cd.yml`**:

```yaml
name: CD — Build & Deploy to VPS
on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}/piggy

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # FE Image
      - uses: docker/build-push-action@v5
        with:
          context: ./PiggyFE
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-frontend:latest

      # BE Images — build context = root
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: PiggyBE/api-gateway/Dockerfile
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-gateway:latest

      - uses: docker/build-push-action@v5
        with:
          context: .
          file: PiggyBE/identity-service/Dockerfile
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-identity:latest

      - uses: docker/build-push-action@v5
        with:
          context: .
          file: PiggyBE/transaction-service/Dockerfile
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-transaction:latest

      - uses: docker/build-push-action@v5
        with:
          context: .
          file: PiggyBE/notification-service/Dockerfile
          push: true
          tags: ${{ env.IMAGE_PREFIX }}-notification:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/piggy
            git pull origin main
            # Pull latest images và restart
            docker-compose -f infrastructure/docker/docker-compose.yml pull
            docker-compose -f infrastructure/docker/docker-compose.yml \
              up -d --remove-orphans
            # Cleanup old images
            docker image prune -f
```

---

## 📁 Tổng hợp files thay đổi

| File | Action | Ghi chú |
|------|--------|---------|
| `infrastructure/docker/docker-compose.yml` | 🆕 Tạo | Root include file |
| `infrastructure/docker/docker-compose.infra.yml` | 🆕 Tạo | MySQL, Consul, RabbitMQ |
| `infrastructure/docker/docker-compose.services.yml` | 🆕 Tạo | 4 BE services |
| `infrastructure/docker/docker-compose.fe.yml` | 🆕 Tạo | FE + nginx mount |
| `infrastructure/docker/docker-compose.monitor.yml` | 🆕 Tạo | Prometheus, Grafana |
| `infrastructure/nginx/default.conf` | 🆕 Move+Fix | Từ `PiggyBE/nginx.conf` |
| `infrastructure/prometheus/prometheus.yml` | 🆕 Move | Từ `PiggyBE/prometheus.yml` |
| `Piggy/.env.example` | 🆕 Tạo | Template env |
| `Piggy/.env` | ✏️ Move | Từ `PiggyBE/.env` |
| `Piggy/.gitignore` | 🆕 Tạo | Root gitignore |
| `PiggyFE/Dockerfile` | 🆕 Tạo | Multi-stage Node→nginx |
| `PiggyFE/vite.config.ts` | ✏️ Sửa | Thêm dev server proxy |
| `PiggyBE/api-gateway/Dockerfile` | 🆕 Tạo | Multi-stage Maven self-build |
| `PiggyBE/identity-service/Dockerfile` | 🆕 Tạo | Multi-stage Maven self-build |
| `PiggyBE/transaction-service/Dockerfile` | 🆕 Tạo | Multi-stage Maven self-build |
| `PiggyBE/notification-service/Dockerfile` | 🆕 Tạo | Multi-stage Maven self-build |
| `scripts/dev-start.ps1` | 🆕 Tạo | Local infra startup |
| `scripts/ngrok-update.ps1` | 🆕 Tạo | Ngrok CORS update |
| `.github/workflows/ci.yml` | 🆕 Tạo | CI |
| `.github/workflows/cd.yml` | 🆕 Tạo | CD |
| `PiggyBE/docker-compose.yml` | 🗑️ Xóa | Replaced |
| `PiggyBE/nginx.conf` | 🗑️ Xóa | Moved to infrastructure |
| `PiggyBE/.env` | 🗑️ Xóa | Moved to root |

---

## ✅ Verification Checklist

### Local Dev (IntelliJ + npm)
- [ ] `.\scripts\dev-start.ps1` → MySQL, Consul, RabbitMQ running
- [ ] IntelliJ run api-gateway + services thành công
- [ ] `npm run dev` → `http://localhost:5173` → gọi được API qua Vite proxy

### Full Docker
- [ ] `docker-compose -f infrastructure/docker/docker-compose.yml up -d` OK
- [ ] FE tại `http://localhost:80`
- [ ] API Gateway tại `http://localhost:8080`

### VPS + Ngrok
- [ ] `ngrok http 80` → public URL
- [ ] `.\scripts\ngrok-update.ps1` → CORS cập nhật, không sửa code
- [ ] Public URL accessible từ thiết bị khác

### CI/CD
- [ ] GitHub Actions CI pass trên PR
- [ ] CD build image và push lên GHCR thành công
- [ ] SSH deploy lên VPS thành công

---

*Updated by `@[project-planner]` — 2026-05-13 v2*
