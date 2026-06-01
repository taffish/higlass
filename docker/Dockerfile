FROM node:22-bookworm AS frontend

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG HIGLASS_VERSION=2.3.4
ARG HIGLASS_COMMIT=5600c33ba6431b1ca53db35be31838115673c843

WORKDIR /build

RUN set -eux; \
    git clone --depth 1 --branch "v${HIGLASS_VERSION}" https://github.com/higlass/higlass.git /build/higlass-src; \
    test "$(git -C /build/higlass-src rev-parse HEAD)" = "${HIGLASS_COMMIT}"

COPY docker/higlass-web/ /tmp/taf-higlass-web/

WORKDIR /build/higlass-src

RUN set -eux; \
    npm clean-install --legacy-peer-deps; \
    rm -f index.html; \
    cp /tmp/taf-higlass-web/index.html index.html; \
    mkdir -p taf-higlass-web; \
    cp /tmp/taf-higlass-web/main.jsx taf-higlass-web/main.jsx; \
    cp /tmp/taf-higlass-web/style.css taf-higlass-web/style.css; \
    npm exec -- vite build --outDir /tmp/higlass-web-dist --emptyOutDir; \
    node -e "const p=require('./package.json'); if (p.version !== '${HIGLASS_VERSION}') throw new Error(p.version)"; \
    test -s /tmp/higlass-web-dist/index.html; \
    find /tmp/higlass-web-dist/assets -type f -name '*.js' | grep -F . >/dev/null

FROM ubuntu:20.04

LABEL maintainer="taffish@163.com"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG DEBIAN_FRONTEND=noninteractive
ARG UBUNTU_MIRROR=http://archive.ubuntu.com/ubuntu
ARG PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ARG PIP_VERSION=25.0.1
ARG SETUPTOOLS_VERSION=75.3.4
ARG WHEEL_VERSION=0.45.1
ARG CYTHON_VERSION=0.29.37
ARG PYSAM_VERSION=0.24.0
ARG UWSGI_PIP_VERSION=2.0.31
ARG SCIPY_VERSION=1.10.1

ENV PIP_INDEX_URL=${PIP_INDEX_URL}
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN set -eux; \
    sed -i "s|http://archive.ubuntu.com/ubuntu|${UBUNTU_MIRROR}|g; s|http://security.ubuntu.com/ubuntu|${UBUNTU_MIRROR}|g" /etc/apt/sources.list; \
    sed -i '/focal-backports/d' /etc/apt/sources.list; \
    for attempt in 1 2 3 4 5; do \
      apt-get -o Acquire::Retries=5 -o Acquire::http::Timeout=30 update && break; \
      test "$attempt" -lt 5; \
      rm -rf /var/lib/apt/lists/*; \
      sleep $((attempt * 5)); \
    done; \
    apt-get -o Acquire::Retries=5 -o Acquire::http::Timeout=30 install -y --no-install-recommends \
      bash \
      build-essential \
      bzip2 \
      ca-certificates \
      curl \
      fuse \
      git \
      libbz2-dev \
      libcurl4-openssl-dev \
      libjpeg-dev \
      liblzma-dev \
      libpng-dev \
      libssl-dev \
      nginx \
      python3-dev \
      python3-pip \
      supervisor \
      unzip \
      uwsgi \
      uwsgi-plugin-python3 \
      wget \
      zlib1g-dev; \
    rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/local/bin/python \
 && python3 -m pip install --no-cache-dir --upgrade "pip==${PIP_VERSION}" "setuptools==${SETUPTOOLS_VERSION}" "wheel==${WHEEL_VERSION}" \
 && python3 -m pip install --no-cache-dir "Cython==${CYTHON_VERSION}" numpy==1.22.1 "pysam==${PYSAM_VERSION}" "uWSGI==${UWSGI_PIP_VERSION}" "scipy==${SCIPY_VERSION}"

ARG HIGLASS_VERSION=2.3.4
ARG HIGLASS_COMMIT=5600c33ba6431b1ca53db35be31838115673c843
ARG HIGLASS_DOCKER_VERSION=0.10.5
ARG HIGLASS_DOCKER_COMMIT=486514cc69c2a267c4210976daf6558b3e0653cc
ARG SERVER_VERSION=1.14.8
ARG SERVER_COMMIT=cbfe79fe3ae0e844b4c0c78142a83733c8cc66a2
ARG FRONTEND_BUILD=taffish-vite-viewer
ARG NUMBA_VERSION=0.56.4
ARG LLVMLITE_VERSION=0.39.1
ARG PANDAS_VERSION=1.5.3
ARG CLODIUS_VERSION=0.19.0
ARG PYBBI_VERSION=0.2.2
ARG PYBIGWIG_VERSION=0.3.22
ARG WAIT_FOR_IT_COMMIT=81b1373f17855a4dc21156cfe1694c31d7d1792e
ARG WORKERS=1

RUN groupadd -r higlass \
 && useradd -r -g higlass -m -d /home/higlass higlass

WORKDIR /home/higlass
RUN chown higlass:higlass /home/higlass

RUN set -eux; \
    git clone --depth 1 --branch "v${HIGLASS_DOCKER_VERSION}" https://github.com/higlass/higlass-docker.git /tmp/higlass-docker; \
    test "$(git -C /tmp/higlass-docker rev-parse HEAD)" = "${HIGLASS_DOCKER_COMMIT}"; \
    git clone --depth 1 --branch "v${SERVER_VERSION}" https://github.com/higlass/higlass-server.git /tmp/higlass-server-src; \
    test "$(git -C /tmp/higlass-server-src rev-parse HEAD)" = "${SERVER_COMMIT}"

RUN python3 -m pip install --no-cache-dir "pyBigWig==${PYBIGWIG_VERSION}" cytoolz==0.10.1 \
 && cp /tmp/higlass-server-src/requirements.txt /tmp/higlass-server-requirements.txt \
 && sed -i -e '/^numba==/d' -e '/^numpy==/d' -e '/^clodius==/d' /tmp/higlass-server-requirements.txt \
 && python3 -m pip install --no-cache-dir "llvmlite==${LLVMLITE_VERSION}" "numba==${NUMBA_VERSION}" "pandas==${PANDAS_VERSION}" numpy==1.22.1 \
 && python3 -m pip install --no-cache-dir -r /tmp/higlass-server-requirements.txt \
 && python3 -m pip install --no-cache-dir "clodius==${CLODIUS_VERSION}" "pybbi==${PYBBI_VERSION}" numpy==1.22.1 \
 && rm -f /tmp/higlass-server-requirements.txt

WORKDIR /home/higlass/projects
RUN chown higlass:higlass /home/higlass/projects

RUN mv /tmp/higlass-server-src /home/higlass/projects/higlass-server \
 && chown -R higlass:higlass /home/higlass/projects/higlass-server

USER higlass
RUN set -eux; \
    git clone --depth 1 https://github.com/vishnubob/wait-for-it.git; \
    git -C wait-for-it checkout "${WAIT_FOR_IT_COMMIT}"; \
    test "$(git -C wait-for-it rev-parse HEAD)" = "${WAIT_FOR_IT_COMMIT}"

USER root
WORKDIR /home/higlass/projects/higlass-server
RUN python manage.py collectstatic --noinput -c

WORKDIR /home/higlass/projects
COPY --from=frontend /tmp/higlass-web-dist/ /home/higlass/projects/higlass-app/

RUN set -eux; \
    mkdir -p /home/higlass/projects/hipiler; \
    ( echo "HIGLASS_VERSION: ${HIGLASS_VERSION}"; \
      echo "HIGLASS_COMMIT: ${HIGLASS_COMMIT}"; \
      echo "FRONTEND_BUILD: ${FRONTEND_BUILD}"; \
      echo "FRONTEND_SOURCE: higlass v${HIGLASS_VERSION}"; \
      echo "HIGLASS_DOCKER_SCAFFOLD_VERSION: ${HIGLASS_DOCKER_VERSION}"; \
      echo "HIGLASS_DOCKER_COMMIT: ${HIGLASS_DOCKER_COMMIT}"; \
      echo "SERVER_VERSION: ${SERVER_VERSION}"; \
      echo "SERVER_COMMIT: ${SERVER_COMMIT}"; \
      echo "NUMBA_VERSION: ${NUMBA_VERSION}"; \
      echo "LLVMLITE_VERSION: ${LLVMLITE_VERSION}"; \
      echo "PANDAS_VERSION: ${PANDAS_VERSION}"; \
      echo "CLODIUS_VERSION: ${CLODIUS_VERSION}"; \
      ) > /home/higlass/projects/higlass-app/version.txt

RUN cp /tmp/higlass-docker/web-context/nginx.conf /etc/nginx/nginx.conf \
 && cp /tmp/higlass-docker/web-context/sites-enabled/* /etc/nginx/sites-enabled/ \
 && cp /tmp/higlass-docker/web-context/uwsgi_params /home/higlass/projects/higlass-server/ \
 && cp /tmp/higlass-docker/web-context/default-viewconf-fixture.xml /home/higlass/projects/higlass-server/ \
 && cp /tmp/higlass-docker/web-context/supervisord.conf /home/higlass/projects/ \
 && cp /tmp/higlass-docker/web-context/uwsgi.ini /home/higlass/projects/ \
 && cp /tmp/higlass-docker/web-context/*.sh /home/higlass/projects/ \
 && rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default \
 && grep 'listen' /etc/nginx/sites-enabled/* \
 && rm -rf /tmp/higlass-docker \
 && chown -R higlass:higlass /home/higlass/projects

COPY docker/higlass /usr/local/bin/higlass
COPY docker/higlass-manage /usr/local/bin/higlass-manage

RUN chmod 755 /usr/local/bin/higlass /usr/local/bin/higlass-manage \
 && higlass --version | grep -F "higlass 2.3.4" \
 && higlass -- --version | grep -F "higlass 2.3.4" \
 && higlass --version | grep -F "HIGLASS_VERSION: 2.3.4" \
 && higlass --version | grep -F "FRONTEND_BUILD: taffish-vite-viewer" \
 && higlass --version | grep -F "FRONTEND_SOURCE: higlass v2.3.4" \
 && higlass --version | grep -F "SERVER_VERSION: 1.14.8" \
 && higlass --version | grep -F "SERVER_COMMIT: cbfe79fe3ae0e844b4c0c78142a83733c8cc66a2" \
 && higlass --version | grep -F "NUMBA_VERSION: 0.56.4" \
 && higlass --version | grep -F "LLVMLITE_VERSION: 0.39.1" \
 && higlass --version | grep -F "PANDAS_VERSION: 1.5.3" \
 && higlass --version | grep -F "CLODIUS_VERSION: 0.19.0" \
 && higlass --help | grep -F "Usage: higlass" \
 && higlass-manage help | grep -F "Available subcommands" \
 && test -s /home/higlass/projects/higlass-app/index.html \
 && nginx -t

WORKDIR /home/higlass/projects

EXPOSE 80
VOLUME /data
VOLUME /tmp

ENV HIGLASS_SERVER_BASE_DIR=/data
ENV WORKERS=${WORKERS}

ENTRYPOINT []
CMD ["higlass"]

ENV TAFFISH_ENV=TAFFISH
ENV TAFFISH_NAME=higlass
