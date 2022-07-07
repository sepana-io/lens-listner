# Install dependencies only when needed
FROM node:14-alpine

RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]