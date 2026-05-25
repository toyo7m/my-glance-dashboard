# Use the official Glance image as the base
FROM glanceapp/glance:latest

# Copy your local configuration and assets into the container
# Glance expects config in /app/config and assets in /app/assets
COPY config /app/config
COPY assets /app/assets

# Expose the default Glance port
EXPOSE 8080

# The base image already has the ENTRYPOINT set to run the glance binary
