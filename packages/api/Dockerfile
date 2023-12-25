FROM ghcr.io/alwatr/node:20.10.0 as builder

RUN set -ex; corepack enable;

COPY . .

RUN set -eux; \
  yarn install --immutable; \
  yarn build; \
  ls -lahF .; \
  ls -RlahF /app/packages/api;

# ---

FROM ghcr.io/alwatr/node:20.10.0
LABEL org.opencontainers.image.base.name="ghcr.io/alwatr/node:20.10.0"

COPY --from=builder /app/packages/api/dist/ .
# RUN set -eux; ls -RlahF /app;

# ENV NODE_OPTIONS --enable-source-maps
ENV HOST="0.0.0.0" \
    PORT="80"

EXPOSE 80

CMD ["node", "main.mjs"]

