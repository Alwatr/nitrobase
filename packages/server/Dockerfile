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
ARG packageSource
COPY ${packageSource}/package.json ./
COPY ${packageSource}/dist ./dist

# RUN pwd; ls -lAhF;
