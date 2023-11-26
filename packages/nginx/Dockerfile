FROM ghcr.io/alwatr/nginx-json:2.0.0

COPY etc/nginx/ /etc/nginx/
COPY data/ .
RUN ls -RlahF /etc/nginx /data

# ENV NGINX_CLIENT_MAX_BODY_SIZE=1k \
#     NGINX_SENDFILE=on \
#     NGINX_SENDFILE_MAX_CHUNK=2m \
#     NGINX_TCP_NOPUSH=on \
#     NGINX_TCP_NODELAY=on \
#     NGINX_OPEN_FILE_CACHE="max=5000 inactive=1h" \
#     NGINX_OPEN_FILE_CACHE_VALID=1s \
#     NGINX_OPEN_FILE_CACHE_MIN_USES=2 \
#     NGINX_OUTPUT_BUFFERS="8 8k" \
#     NGINX_EXPIRES_DYNAMIC=epoch \
#     NGINX_EXPIRES_STATIC=max \
#     NGINX_EXPIRES_DEFAULT=epoch \
#     NGINX_LIMIT_REQ_RATE=400 \
#     NGINX_LIMIT_REQ_BURST=1000 \
#     NGINX_DISABLE_SYMLINKS=if_not_owner

ARG BUILD_REV
ARG BUILD_DATE
LABEL org.opencontainers.image.title="alwatr/storage-server" \
      org.opencontainers.image.description="This is a high-performance version of NGINX, which has been enhanced by Alwatr for the purpose of serving JSON content efficiently." \
      org.opencontainers.image.base.name="ghcr.io/alwatr/nginx-json:2.0.0" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.ref.name="2.0.0-nginx1.25.3-alpine3.18-slim" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created=${BUILD_DATE} \
      org.opencontainers.image.revision=${BUILD_REV} \
      org.opencontainers.image.vendor="Alwatr" \
      org.opencontainers.image.source="https://github.com/Alwatr/storage" \
      org.opencontainers.image.url="https://github.com/Alwatr/storage" \
      org.opencontainers.image.documentation="https://github.com/Alwatr/storage" \
      org.opencontainers.image.authors="S. Ali Mihandoost <ali.mihandoost@gmail.com> (https://ali.mihandoost.com), S. Amir Mohammad Najafi <njfamirm@gmail.com> (https://njfamirm.ir/)"
