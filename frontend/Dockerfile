FROM node:23-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
RUN npm i lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu sass-embedded-linux-x64

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "start"]