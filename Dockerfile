# ── Stage 1: Build Java ──
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# ── Stage 2: Runtime ──
FROM alpine:3.20

# Install Nginx, PHP 8.3, Java 17 JRE, Supervisor
RUN apk add --no-cache \
    nginx \
    php83 \
    php83-fpm \
    php83-session \
    openjdk17-jre-headless \
    supervisor

# Create directories
RUN mkdir -p /var/www/html/frontend /run/nginx /data /etc/nginx/conf.d

# Copy Java JAR
COPY --from=build /app/target/api-0.0.1-SNAPSHOT.jar /app/app.jar

# Copy frontend files
COPY frontend/ /var/www/html/frontend/

# Copy config files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/www.conf /etc/php83/php-fpm.d/www.conf

# Create startup script
RUN printf '#!/bin/sh\n\
java -jar /app/app.jar --spring.profiles.active=prod &\n\
php-fpm83 -F &\n\
nginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
