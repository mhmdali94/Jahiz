# Multi-stage build: compile the static site with Node, then serve the
# plain output with nginx. The runtime image never contains node_modules,
# source, or the CLI's signing key — just the built dist/ files.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
