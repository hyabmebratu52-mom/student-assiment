FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

RUN docker-php-ext-install pdo_mysql mbstring gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy all files
COPY . .

# Find where composer.json is and run composer & artisan from there
CMD sh -c "\
  TARGET_DIR=\$(find /app -name 'composer.json' -exec dirname {} \;) ; \
  if [ -z \"\$TARGET_DIR\" ]; then TARGET_DIR=/app; fi ; \
  cd \$TARGET_DIR ; \
  composer install --no-interaction --optimize-autoloader --no-dev ; \
  php artisan config:cache ; \
  php artisan route:cache ; \
  php artisan serve --host=0.0.0.0 --port=8080 \
"