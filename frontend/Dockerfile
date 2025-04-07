# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:20 AS build-stage

WORKDIR /app

# Copy package files first for better caching
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY ./ /app/

# Set build arguments
ARG VITE_API_URL=${VITE_API_URL}

# Build with legacy mode explicitly
RUN npm run build -- --mode legacy


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1

# Copy the built assets from the build stage
COPY --from=build-stage /app/dist/ /usr/share/nginx/html

# Copy Nginx configuration files
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx-backend-not-found.conf /etc/nginx/extra-conf.d/backend-not-found.conf

# Set up cache control for static assets to improve performance for legacy browsers
RUN mkdir -p /etc/nginx/conf.d/
RUN echo 'add_header Cache-Control "public, max-age=31536000, immutable";' > /etc/nginx/conf.d/cache-control.conf
