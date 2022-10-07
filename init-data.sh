#!/bin/bash
set -e;
if [ -n "${POSTGRES_USERNAME:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USERNAME"  <<-EOSQL
    CREATE DATABASE ${POSTGRES_DATABASE};
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DATABASE} TO ${POSTGRES_USERNAME};
  EOSQL
else
  echo "SETUP INFO: No Environment variables given!"
fi