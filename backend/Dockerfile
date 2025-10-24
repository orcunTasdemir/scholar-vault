# Build stage
FROM rust:latest AS builder

WORKDIR /app

# Install sqlx-cli for migrations
RUN cargo install sqlx-cli --no-default-features --features postgres

# Copy manifests first (for better layer caching)
COPY Cargo.toml Cargo.lock ./

# Create dummy source to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true
RUN rm -rf src

# Copy actual source code
COPY src ./src
COPY migrations ./migrations
COPY .sqlx ./.sqlx

# Build app
RUN cargo build --release

# Runtime stage
FROM debian:sid-slim

# Install deps
RUN apt-get update && apt-get install -y libssl3 ca-certificates curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy bin and sqlx-cli from builder
COPY --from=builder /app/target/release/scholarvault-backend .
COPY --from=builder /usr/local/cargo/bin/sqlx /usr/local/bin/sqlx

# Copy migrations and entrypoint
COPY migrations ./migrations
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Create uploads dir
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]