FROM node:22-alpine as builder

WORKDIR /app

ARG VITE_ENABLE_TEST_FEATURES=false
ENV VITE_ENABLE_TEST_FEATURES=$VITE_ENABLE_TEST_FEATURES

COPY package*.json ./

RUN rm -f package-lock.json && npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
