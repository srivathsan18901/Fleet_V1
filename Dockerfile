# Step 1: Build the Angular application
FROM node:18 AS build
 
# Set the working directory
WORKDIR /app
 
# Copy package.json and package-lock.json
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Install xlsx-js-style specifically if not included in package.json
RUN npm install xlsx-js-style
 
# Install Angular CLI globally
RUN npm install -g @angular/cli
 
RUN npm i heatmap-ts
 
# Copy the rest of the application files
COPY . .
 
# Build the Angular application
RUN npm run build --prod
 
# Step 2: Serve the application using Nginx
FROM nginx:alpine
 
# Copy the built application from the previous stage
COPY --from=build /app/dist/fleet-ui/browser /usr/share/nginx/html
 
# Expose port 80
EXPOSE 80
 
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
