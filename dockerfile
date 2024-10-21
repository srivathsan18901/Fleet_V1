# Stage 1: Build the Angular application
FROM node:18 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY FleetUI/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY FleetUI/ .

# Build the application
RUN npm run build --prod

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build files from the previous stage
COPY --from=build /app/dist/fleet-ui/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to run Nginx
CMD ["nginx", "-g", "daemon off;"]
