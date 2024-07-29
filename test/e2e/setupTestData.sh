#!/bin/bash

set -e

cd "$(dirname "$0")"

cd ../..
docker-compose up -d informix-db
source .env

cd test/e2e/flyway
./gradlew flywayMigrate -i -Pflyway.configFiles=flyway.conf -Pflyway.user=${DB_USERNAME} -Pflyway.password=${DB_PASSWORD}
