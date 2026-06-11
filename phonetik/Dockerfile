FROM rust:1.88-slim AS builder
RUN cargo install phonetik --locked
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/cargo/bin/phonetik-server /usr/local/bin/phonetik-server
EXPOSE 1273
CMD ["phonetik-server"]
