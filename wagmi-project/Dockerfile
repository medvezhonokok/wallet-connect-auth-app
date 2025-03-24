# Use an appropriate base image
FROM node:22.14.0

# Set the working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y build-essential

# Copy package.json and package-lock.json before installing dependencies
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the necessary port
EXPOSE 3000

# Run the application in production mode
CMD ["npm", "run", "start"]