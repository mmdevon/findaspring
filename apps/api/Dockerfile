FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --omit=dev --workspace @findaspring/api

COPY apps/api ./apps/api
COPY db ./db

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "--workspace", "@findaspring/api", "run", "start"]
