# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Rest of your Dockerfile...
# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY server.js .

# Expose the port your app runs on (adjust if necessary)
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]   