FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_PRODUCT_API_URL=/api/products
ENV VITE_QUOTE_API_URL=/api/quotes
ENV VITE_ADMIN_API_URL=/api/admin
ENV VITE_AI_API_URL=/api/ai

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80