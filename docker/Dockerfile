FROM node:22-bookworm@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d AS frontend

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG HIGLASS_VERSION=2.3.5
ARG HIGLASS_COMMIT=b35461175d6593aaa94147ec4885200c7f1f5e5a

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

FROM ubuntu:20.04@sha256:8feb4d8ca5354def3d8fce243717141ce31e2c428701f6682bd2fafe15388214 AS python-builder

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
ARG HIGLASS_DOCKER_VERSION=0.10.5
ARG HIGLASS_DOCKER_COMMIT=486514cc69c2a267c4210976daf6558b3e0653cc
ARG SERVER_VERSION=1.14.8
ARG SERVER_COMMIT=cbfe79fe3ae0e844b4c0c78142a83733c8cc66a2
ARG NUMBA_VERSION=0.56.4
ARG LLVMLITE_VERSION=0.39.1
ARG PANDAS_VERSION=1.5.3
ARG CLODIUS_VERSION=0.19.0
ARG PYBBI_VERSION=0.2.2
ARG PYBIGWIG_VERSION=0.3.22

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
      build-essential \
      ca-certificates \
      git \
      libbz2-dev \
      libcurl4-openssl-dev \
      libjpeg-dev \
      liblzma-dev \
      libpng-dev \
      libssl-dev \
      python3-dev \
      python3-pip \
      zlib1g-dev; \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --upgrade \
      "pip==${PIP_VERSION}" "setuptools==${SETUPTOOLS_VERSION}" "wheel==${WHEEL_VERSION}" \
 && python3 -m pip install --no-cache-dir \
      "Cython==${CYTHON_VERSION}" numpy==1.22.1 "pysam==${PYSAM_VERSION}" \
      "uWSGI==${UWSGI_PIP_VERSION}" "scipy==${SCIPY_VERSION}"

RUN set -eux; \
    git clone --depth 1 --branch "v${HIGLASS_DOCKER_VERSION}" https://github.com/higlass/higlass-docker.git /tmp/higlass-docker; \
    test "$(git -C /tmp/higlass-docker rev-parse HEAD)" = "${HIGLASS_DOCKER_COMMIT}"; \
    git clone --depth 1 --branch "v${SERVER_VERSION}" https://github.com/higlass/higlass-server.git /opt/higlass-server; \
    test "$(git -C /opt/higlass-server rev-parse HEAD)" = "${SERVER_COMMIT}"; \
    rm -rf /tmp/higlass-docker/.git /opt/higlass-server/.git

RUN python3 -m pip install --no-cache-dir "pyBigWig==${PYBIGWIG_VERSION}" cytoolz==0.10.1 \
 && cp /opt/higlass-server/requirements.txt /tmp/higlass-server-requirements.txt \
 && sed -i -e '/^numba==/d' -e '/^numpy==/d' -e '/^clodius==/d' /tmp/higlass-server-requirements.txt \
 && python3 -m pip install --no-cache-dir \
      "llvmlite==${LLVMLITE_VERSION}" "numba==${NUMBA_VERSION}" \
      "pandas==${PANDAS_VERSION}" numpy==1.22.1 \
 && python3 -m pip install --no-cache-dir -r /tmp/higlass-server-requirements.txt \
 && python3 -m pip install --no-cache-dir \
      "clodius==${CLODIUS_VERSION}" "pybbi==${PYBBI_VERSION}" numpy==1.22.1 \
 && rm -f /tmp/higlass-server-requirements.txt

RUN set -eux; \
    cp /tmp/higlass-docker/web-context/uwsgi_params /opt/higlass-server/; \
    cp /tmp/higlass-docker/web-context/default-viewconf-fixture.xml /opt/higlass-server/; \
    mkdir -p /opt/higlass-server/log; \
    cd /opt/higlass-server; \
    python3 manage.py collectstatic --noinput -c; \
    rm -rf log

FROM ubuntu:20.04@sha256:8feb4d8ca5354def3d8fce243717141ce31e2c428701f6682bd2fafe15388214

LABEL maintainer="taffish@163.com"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG DEBIAN_FRONTEND=noninteractive
ARG UBUNTU_MIRROR=http://archive.ubuntu.com/ubuntu
ARG HIGLASS_VERSION=2.3.5
ARG HIGLASS_COMMIT=b35461175d6593aaa94147ec4885200c7f1f5e5a
ARG HIGLASS_DOCKER_VERSION=0.10.5
ARG HIGLASS_DOCKER_COMMIT=486514cc69c2a267c4210976daf6558b3e0653cc
ARG SERVER_VERSION=1.14.8
ARG SERVER_COMMIT=cbfe79fe3ae0e844b4c0c78142a83733c8cc66a2
ARG FRONTEND_BUILD=taffish-vite-viewer
ARG NUMBA_VERSION=0.56.4
ARG LLVMLITE_VERSION=0.39.1
ARG PANDAS_VERSION=1.5.3
ARG CLODIUS_VERSION=0.19.0
ARG WORKERS=1

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
      bzip2 \
      ca-certificates \
      curl \
      fuse \
      libbz2-1.0 \
      libcurl4 \
      libgomp1 \
      libjpeg-turbo8 \
      liblzma5 \
      libpng16-16 \
      libpython3.8 \
      libssl1.1 \
      nginx \
      python3 \
      unzip \
      wget \
      zlib1g; \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/* /usr/share/doc/* /usr/share/man/*

COPY --from=python-builder /usr/local/ /usr/local/
COPY --from=python-builder /opt/higlass-server/ /home/higlass/projects/higlass-server/
COPY --from=frontend /tmp/higlass-web-dist/ /home/higlass/projects/higlass-app/

RUN set -eux; \
    ln -s /usr/bin/python3 /usr/local/bin/python; \
    ln -sf /dev/stderr /var/log/nginx/error.log; \
    ln -sf /dev/stdout /var/log/nginx/access.log; \
    groupadd -r higlass; \
    useradd -r -g higlass -m -d /home/higlass higlass; \
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
      ) > /home/higlass/projects/higlass-app/version.txt; \
    chown -R higlass:higlass /home/higlass/projects

COPY docker/higlass /usr/local/bin/higlass
COPY docker/higlass-manage /usr/local/bin/higlass-manage
COPY docker/higlass-runtime /usr/local/bin/higlass-runtime
COPY docker/higlass-smoke /usr/local/bin/higlass-smoke

RUN chmod 755 \
      /usr/local/bin/higlass \
      /usr/local/bin/higlass-manage \
      /usr/local/bin/higlass-runtime \
      /usr/local/bin/higlass-smoke \
 && higlass-smoke buildtime

WORKDIR /home/higlass/projects

EXPOSE 80 8000

ENV WORKERS=${WORKERS}

ENTRYPOINT []
CMD ["higlass"]

ENV TAFFISH_ENV=TAFFISH
ENV TAFFISH_NAME=higlass
