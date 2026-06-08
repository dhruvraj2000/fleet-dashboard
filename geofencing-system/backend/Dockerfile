FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o geofencing-backend ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/geofencing-backend .

EXPOSE 8080
CMD ["./geofencing-backend"]
