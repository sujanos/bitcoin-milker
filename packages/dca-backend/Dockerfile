# Use the official MongoDB image
FROM mongo:7

COPY init-mongo.js /docker-entrypoint-initdb.d/init-mongo.js

ENV MONGO_INITDB_ROOT_USERNAME=root
ENV MONGO_INITDB_ROOT_PASSWORD=secret
ENV MONGO_INITDB_DATABASE=dca

EXPOSE 27017
