FROM 725496895483.dkr.ecr.ap-southeast-2.amazonaws.com/step/enablement/nginx:latest

ARG APP_NAME=plan-generation
COPY container/nginx.conf  /etc/nginx/conf.d/default.conf
COPY container/entrypoint.sh /entrypoint.sh

ENV APP_NAME=$APP_NAME
ENV APP_VERSION=$APP_VERSION

WORKDIR /usr/share/nginx/html
RUN mkdir -p $APP_NAME
COPY build/ $APP_NAME
COPY public $APP_NAME
RUN mkdir -p $APP_NAME/config
COPY config/local/env.json $APP_NAME/config
COPY config/local/nr-config.js $APP_NAME/config

ARG APP_VERSION=0.0
RUN echo $APP_VERSION > $APP_NAME/static/version.txt

RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
