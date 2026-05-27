# Use the official Glance image as the base
FROM glanceapp/glance:latest

# Copy your local configuration and assets into the container
COPY config /app/config
COPY assets /app/assets

# Show Eastern time (clock widget / timestamps) instead of the container's UTC
ENV TZ=America/New_York

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# The base image already has the ENTRYPOINT set to run the glance binary
