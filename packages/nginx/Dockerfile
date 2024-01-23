FROM ghcr.io/alwatr/nginx-json:2.4.1

LABEL org.opencontainers.image.base.name="ghcr.io/alwatr/nginx-json:2.4.1"

RUN rm -fv /etc/nginx/templates/location.d/90-home-json.conf.template
COPY etc/nginx/ /etc/nginx/
RUN ls -RlahF /etc/nginx /default-data /data

ENV NGINX_DOCUMENT_ROOT=/storage \
    NGINX_OPEN_FILE_CACHE="max=5000 inactive=8h" \
    NGINX_OPEN_FILE_CACHE_VALID=500ms \
    NGINX_OPEN_FILE_CACHE_MIN_USES=1 \
    NGINX_OUTPUT_BUFFERS="8 8k" \
    NGINX_EXPIRES_DYNAMIC=epoch \
    NGINX_EXPIRES_STATIC=max \
    NGINX_EXPIRES_DEFAULT=epoch \
    NGINX_LIMIT_REQ_RATE=400 \
    NGINX_LIMIT_REQ_BURST=1000 \
    NGINX_DISABLE_SYMLINKS=if_not_owner
