# Use an appropriate base image
FROM node:22.14.0

# Set the working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y build-essential

# Install project dependencies
COPY package.json package-lock.json ./
RUN npm install --force
RUN npm install @solana/spl-token@^0.4.13 @solana/wallet-adapter-base@^0.9.23 @solana/wallet-adapter-react-ui@^0.9.35 @solana/wallet-adapter-react@^0.15.35 @solana/wallet-adapter-wallets@^0.19.32 @solana/web3.js@^1.98.0

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the necessary port
EXPOSE 3000

# Run the application in production mode
CMD ["npm", "run", "start"]