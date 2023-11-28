FROM ghcr.io/alwatr/node:20.10.0 as builder

LABEL org.opencontainers.image.base.name="ghcr.io/alwatr/node:20.10.0"

RUN set -ex; corepack enable;

COPY . .

ENV NODE_ENV production
RUN set -eux; \
  yarn install --immutable; \
  yarn build;

# ---

FROM ghcr.io/alwatr/node:20.10.0

COPY --from=builder /app/packages/api/dist/ .
RUN set -eux; ls -RlahF /app;

ENV NODE_ENV production
ENV NODE_OPTIONS --enable-source-maps
ENV HOST 0.0.0.0
ENV PORT 80
EXPOSE 80

CMD ["node", "main.mjs"]
