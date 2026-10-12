# Laravel API — PHP-FPM 8.3 (production image)
# Build context: repository root.  docker build -f infra/docker/api.Dockerfile -t withaq/api .

FROM composer:2 AS vendor
WORKDIR /app
COPY apps/api/composer.json apps/api/composer.lock* ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist
COPY apps/api/ ./
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev

FROM php:8.3-fpm-alpine AS runtime
RUN apk add --no-cache icu-libs libzip libpng libjpeg-turbo libwebp freetype \
 && apk add --no-cache --virtual .build $PHPIZE_DEPS icu-dev libzip-dev libpng-dev libjpeg-turbo-dev libwebp-dev freetype-dev \
 && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype \
 && docker-php-ext-install -j"$(nproc)" pdo_mysql intl zip gd opcache bcmath \
 && pecl install redis && docker-php-ext-enable redis \
 && apk del .build

# Hardened PHP settings
RUN { \
  echo 'expose_php=Off'; echo 'display_errors=Off'; echo 'log_errors=On'; \
  echo 'upload_max_filesize=6M'; echo 'post_max_size=7M'; echo 'memory_limit=256M'; \
  echo 'session.use_strict_mode=1'; echo 'allow_url_include=Off'; \
  echo 'opcache.enable=1'; echo 'opcache.validate_timestamps=0'; echo 'opcache.memory_consumption=192'; \
} > /usr/local/etc/php/conf.d/zz-withaq.ini

WORKDIR /var/www/api
COPY --from=vendor --chown=www-data:www-data /app /var/www/api
RUN rm -f .env && chmod -R ug+rwX storage bootstrap/cache

USER www-data
EXPOSE 9000
CMD ["php-fpm", "-F"]
