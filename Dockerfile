FROM nginx:latest

# Copy custom nginx configuration
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copy the website files to the nginx html folder
COPY src/ /usr/share/nginx/html/

# Ensure proper file permissions
RUN chmod -R 755 /usr/share/nginx/html
