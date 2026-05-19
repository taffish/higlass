FROM higlass/higlass-docker:0.10.4

LABEL maintainer="taffish@163.com"

USER root

COPY docker/higlass /usr/local/bin/higlass
COPY docker/higlass-manage /usr/local/bin/higlass-manage

RUN chmod 755 /usr/local/bin/higlass /usr/local/bin/higlass-manage \
 && higlass --version | grep -F "higlass-docker 0.10.4" \
 && higlass -- --version | grep -F "higlass-docker 0.10.4" \
 && higlass --version | grep -F "SERVER_VERSION: 1.14.8" \
 && higlass --version | grep -F "LIBRARY_VERSION: 1.11.4" \
 && higlass --help | grep -F "Usage: higlass" \
 && higlass-manage help | grep -F "Available subcommands"

WORKDIR /home/higlass/projects

ENTRYPOINT []
CMD ["higlass"]

ENV TAFFISH_ENV=TAFFISH
ENV TAFFISH_NAME=higlass
