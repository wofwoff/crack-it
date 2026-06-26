# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Pass the build-time environment variables so Vite bakes them into the output
ARG VITE_PROGRESS_SYNC_URL
ARG VITE_VERTEX_PROXY_URL
ARG VITE_VERTEX_PROXY_SECRET
ARG VITE_ENABLE_AI_TOOLS
ENV VITE_PROGRESS_SYNC_URL=$VITE_PROGRESS_SYNC_URL
ENV VITE_VERTEX_PROXY_URL=$VITE_VERTEX_PROXY_URL
ENV VITE_VERTEX_PROXY_SECRET=$VITE_VERTEX_PROXY_SECRET
ENV VITE_ENABLE_AI_TOOLS=$VITE_ENABLE_AI_TOOLS

RUN npm run build

# Stage 2: Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
