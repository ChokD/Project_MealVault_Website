FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

ENV NODE_ENV=production

EXPOSE 3000

# Start the backend
CMD ["node", "index.js"]
# Backend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build || true   # only if you have build step; otherwise skip
EXPOSE 3000
CMD ["node", "index.js"]