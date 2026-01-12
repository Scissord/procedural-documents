FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

# Note: package.json "start" uses nodemon/ts-node, so dev deps must be present.
CMD ["npm", "start"]


