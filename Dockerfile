FROM --platform=linux/amd64 node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "src/app.js"]