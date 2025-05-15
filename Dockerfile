# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Define environment variable for the port (optional, can be overridden)
ENV PORT 3001

# Command to run the application
CMD [ "node", "server.js" ] 