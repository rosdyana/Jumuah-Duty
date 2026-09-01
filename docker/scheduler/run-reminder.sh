#!/bin/sh
set -e
. /app/cron.env

curl -fsS -X POST "${APP_URL}/api/cron/reminders" -H "x-cron-secret: ${CRON_SECRET}"
