#!/bin/bash

set -e

cd "$(dirname "$0")/flyway"

source ../../../.env

./gradlew flywayMigrate -i -Pflyway.configFiles=flyway.conf -Pflyway.user=${DB_USERNAME} -Pflyway.password=${DB_PASSWORD}
