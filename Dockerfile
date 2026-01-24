# Use Node 20
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all source code
COPY . .

# Expose the backend port
EXPOSE 3000

# Run the correct entry point
CMD ["node", "server.js"]
