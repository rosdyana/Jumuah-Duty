#!/bin/sh
set -e

# busybox crond does not inherit the container's environment for cron jobs, so we
# snapshot the vars run-reminder.sh needs into a file it sources explicitly.
{
  echo "APP_URL='${APP_URL}'"
  echo "CRON_SECRET='${CRON_SECRET}'"
} > /app/cron.env

exec crond -f -l 2
