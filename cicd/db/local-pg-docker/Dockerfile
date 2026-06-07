FROM postgres:17

COPY init-non-admin-user.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init-non-admin-user.sh
