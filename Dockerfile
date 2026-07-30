FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy all files first
COPY . /var/www/html

# Install dependencies if composer.json exists
RUN if [ -f composer.json ]; then composer install --no-interaction --optimize-autoloader --no-dev; fi

EXPOSE 80

CMD php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=80