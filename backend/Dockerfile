FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Salin file dependency
COPY package.json ./
COPY package-lock.json* ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./
COPY .npmrc* ./

RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
