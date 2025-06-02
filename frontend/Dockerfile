FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g @expo/cli
COPY . .

EXPOSE 19000 19001 19002 19006 8081

ENV WATCHPACK_POLLING=true
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
CMD ["npx", "expo", "start", "--host", "lan"]