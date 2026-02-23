# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a \
    -o /app/server \
    main.go

# Final stage - use Alpine for minimal but functional image
FROM alpine:3.20

# Install CA certificates and timezone data
RUN apk add --no-cache ca-certificates tzdata

# Copy the binary from builder
COPY --from=builder /app/server /server

# Expose port
EXPOSE 8080

# Set environment variables
ENV GIN_MODE=release \
    PORT=8080

# Run the application
ENTRYPOINT ["/server"]
