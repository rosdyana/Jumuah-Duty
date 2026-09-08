-- Prisma's `migrate dev` command creates/drops a temporary "shadow database"
-- (named prisma_migrate_shadow_db_<uuid>) to detect schema drift. The default
-- MYSQL_USER only gets privileges on MYSQL_DATABASE, so grant this app user
-- rights on any db matching that shadow db naming pattern.
--
-- This file only runs once, when MySQL initializes an EMPTY data directory
-- (see https://hub.docker.com/_/mysql -> "Initializing a fresh instance").
-- If you already have a `mysql_data` volume without this grant, run:
--   docker compose exec mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
--     -e "GRANT ALL PRIVILEGES ON \`prisma_migrate_shadow_db_%\`.* TO 'masjid'@'%'; FLUSH PRIVILEGES;"

GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db_%`.* TO 'masjid'@'%';
FLUSH PRIVILEGES;
