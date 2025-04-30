FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 19000 19001 19002 19006 8081

ENV WATCHPACK_POLLING=true

CMD ["npx", "expo", "start", "--host", "lan"]