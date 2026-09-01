FROM alpine:3.20
RUN apk add --no-cache curl tzdata
WORKDIR /app
COPY crontab /etc/crontabs/root
COPY run-reminder.sh /usr/local/bin/run-reminder.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/run-reminder.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
