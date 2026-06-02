# ===== Stage 1: Build =====
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Copy parent POM + common-lib trước để cache layer dependency
COPY PiggyBE/pom.xml ./pom.xml
COPY PiggyBE/common-lib ./common-lib

# Copy source của service cần build
COPY PiggyBE/identity-service ./identity-service

# Build chỉ service này (-pl) và dependency của nó (-am)
RUN mvn -pl identity-service -am \
    package -DskipTests -q \
    -Dmaven.repo.local=/root/.m2/repository

# ===== Stage 2: Runtime =====
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo non-root user
RUN addgroup -S piggy && adduser -S piggy -G piggy
USER piggy

COPY --from=builder /workspace/identity-service/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-Xms128m", "-Xmx256m", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", "app.jar"]
