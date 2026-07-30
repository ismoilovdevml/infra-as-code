# Build the static bundle, then serve it with nginx. The previous image ran
# `npm run dev` — the Vite dev server — which is not meant to face anything but a
# developer's own machine.
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
