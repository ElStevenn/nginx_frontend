# Use the official NGINX base image
FROM nginx:latest

# Install envsubst (part of the gettext package)
RUN apt-get update && \
    apt-get install -y gettext-base && \
    rm -rf /var/lib/apt/lists/*

# Copy the main NGINX configuration (static, no substitution)
COPY config/nginx.conf /etc/nginx/nginx.conf

# Copy the server configuration template
COPY config/conf.d/default.conf.template /etc/nginx/conf.d/default.conf.template

# Copy config.js.template to the HTML directory
COPY config/conf.d/config.js.template /usr/share/nginx/html/config.js.template

# Copy website files to the HTML directory (DO NOT MODIFY THIS)
COPY src/ /usr/share/nginx/html/ 

# Set appropriate file permissions
RUN chmod -R 755 /usr/share/nginx/html

# Substitute environment variables in default.conf and config.js.template, then start NGINX
CMD ["sh", "-c", \
    "envsubst '$CRYPTOCURRENCY_API $CRYPTOCURRENCY_URL $GLOBAL_API $EXCHANGE_API $BITGET_API' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
     envsubst '$CRYPTOCURRENCY_API $CRYPTOCURRENCY_URL $GLOBAL_API $EXCHANGE_API' < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js && \
     exec nginx -g 'daemon off;'" \
]
