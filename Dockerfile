FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy rest of the app
COPY . .

EXPOSE 3000
CMD ["node", "app.js"]
