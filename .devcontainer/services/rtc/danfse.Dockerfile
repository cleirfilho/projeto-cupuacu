# Build multi-stage baseado no Dockerfile upstream, com suporte à arquitetura nativa.
FROM golang:1.27.1@sha256:162be5298a40ed317005c8339c6de4d10d3eef336d66dc8e9259b03ab9d3a6d2 AS builder
ARG SOURCE_URL
ARG SOURCE_SHA
ENV GOTOOLCHAIN=local
WORKDIR /build
ADD ${SOURCE_URL}/archive/${SOURCE_SHA}.tar.gz /tmp/source.tar.gz
RUN tar -xzf /tmp/source.tar.gz --strip-components=1 \
    && go mod download \
    && go install github.com/swaggo/swag/cmd/swag@v1.16.6 \
    && /go/bin/swag init -g cmd/danfse/main.go -o ./api/swagger \
    && CGO_ENABLED=0 go build -o /danfse-service ./cmd/danfse

FROM alpine:3.23@sha256:469c9ea410b9215eaee7976ba6c0639039b444be8e5d638f7abbada189971eb2
ARG SOURCE_URL
ARG SOURCE_VERSION
ARG SOURCE_SHA
LABEL org.opencontainers.image.source="${SOURCE_URL}" \
      org.opencontainers.image.version="${SOURCE_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_SHA}"

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=America/Sao_Paulo
WORKDIR /app
COPY --from=builder /danfse-service .
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["./danfse-service"]
