FROM docker.io/library/node:20-alpine as builder

WORKDIR /app

COPY . .
RUN if [ -f *.lock ]; then \
      yarn install --immutable; \
    else \
      yarn install; \
    fi;

ENV NODE_ENV production

RUN yarn build:ts

# Build target package
ARG packageSource='packages/server'
RUN set -ex;\
    if [ -z "$packageSource" ]; then\
      echo 'packageSource not defined'>&2;\
      exit 1;\
    fi;
RUN set -ex;\
    cd "$packageSource"; pwd; ls -lahF;\
    yarn build;

# ---

FROM docker.io/library/node:20-alpine as service

WORKDIR /app

CMD ["yarn", "serve"]

ENV NODE_ENV production
ENV NODE_OPTIONS --enable-source-maps
ENV HOST 0.0.0.0
ENV PORT 80
EXPOSE 80

# Copy builded files from last stage
ARG packageSource='packages/server'
COPY --from=builder ${packageSource}/package.json ./
COPY --from=builder ${packageSource}/dist ./dist

# RUN pwd; ls -lAhF;

ARG BUILD_REV
ARG BUILD_DATE
LABEL org.opencontainers.image.title="alwatr/storage-server" \
      org.opencontainers.image.description="Alwatr Storage Server, Elegant micro in-memory json-like storage nanoservice with disk backed, Fastest NoSQL Database." \
      org.opencontainers.image.base.name="docker.io/library/node:20-alpine" \
      org.opencontainers.image.version="4.0.0-rc.0" \
      org.opencontainers.image.ref.name="20-alpine" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.created=${BUILD_DATE} \
      org.opencontainers.image.revision=${BUILD_REV} \
      org.opencontainers.image.vendor="Alwatr" \
      org.opencontainers.image.source="https://github.com/Alwatr/storage" \
      org.opencontainers.image.url="https://github.com/Alwatr/storage" \
      org.opencontainers.image.documentation="https://github.com/Alwatr/storage" \
      org.opencontainers.image.authors="S. Ali Mihandoost <ali.mihandoost@gmail.com> (https://ali.mihandoost.com), S. Amir Mohammad Najafi <njfamirm@gmail.com> (https://njfamirm.ir/)"
