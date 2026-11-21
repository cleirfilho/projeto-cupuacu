FROM eclipse-temurin:25-jdk-noble@sha256:4ddc1a8bdaf283421df5487411aff10b797ccf1e06a339041005114c8f489b5c AS build-base

# The upstream Maven Wrapper downloads its JAR on first use.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

FROM build-base AS database
ARG MIGRATIONS_URL
ARG MIGRATIONS_SHA
WORKDIR /build
ADD ${MIGRATIONS_URL}/archive/${MIGRATIONS_SHA}.tar.gz /tmp/source.tar.gz
RUN tar -xzf /tmp/source.tar.gz --strip-components=1 \
    && mkdir -p calculadora/db \
    && ./mvnw --batch-mode --errors flyway:migrate -Dflyway.configFiles=./flyway/flyway-pro.conf \
    && test -s calculadora/db/calculadora-pro.db

FROM build-base AS application
ARG SOURCE_URL
ARG SOURCE_SHA
ARG JAR_NAME
WORKDIR /build
ADD ${SOURCE_URL}/archive/${SOURCE_SHA}.tar.gz /tmp/source.tar.gz
RUN tar -xzf /tmp/source.tar.gz --strip-components=1 \
    && ./mvnw --batch-mode -DskipTests package \
    && cp "target/${JAR_NAME}.jar" /application.jar

FROM eclipse-temurin:25-jre-noble@sha256:f3dd0838e69b881cc382237d5901e74ae3705b1056ad964b2e0e523b174fef99
ARG SOURCE_URL
ARG SOURCE_VERSION
ARG SOURCE_SHA
ARG MIGRATIONS_URL
ARG MIGRATIONS_VERSION
ARG MIGRATIONS_SHA
LABEL org.opencontainers.image.source="${SOURCE_URL}" \
      org.opencontainers.image.version="${SOURCE_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_SHA}" \
      rtc.migrations.source="${MIGRATIONS_URL}" \
      rtc.migrations.version="${MIGRATIONS_VERSION}" \
      rtc.migrations.revision="${MIGRATIONS_SHA}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=application /application.jar .
COPY --from=database --chmod=0444 /build/calculadora/db/calculadora-pro.db /app/catalogo-inicial.sqlite
COPY --chmod=0755 rtc-start.sh /usr/local/bin/rtc-start
RUN mkdir -p calculadora/db \
    && ln -s /app/catalogo-inicial.sqlite calculadora/db/calculadora-pro.db
ENV SPRING_PROFILES_ACTIVE=offline
USER 10001:10001
ENTRYPOINT ["java", "-jar", "application.jar"]
