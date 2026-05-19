taf-higlass 0.10.4-r1

TAFFISH wrapper for HiGlass Docker, a browser-based service for interactive
visualization of Hi-C contact maps and other tiled genomic tracks.

Modes:
  service      starts the HiGlass browser service on container port 80
  manage       runs higlass-server Django management commands

Usage:
  taf-higlass [TAF-APP-OPTION]
  taf-higlass [SERVICE-OPTIONS]
  taf-higlass higlass [SERVICE-OPTIONS]
  taf-higlass higlass-manage [COMMAND] [OPTIONS...]
  taf-higlass [IN-CONTAINER-COMMAND] [ARGS...]

TAF app options:
  -h, --help       Show this help text
  -v, --version    Show package and command version
  --compile        Print generated shell code instead of running it
  --               Stop parsing TAFFISH wrapper options

Service mode:
  Docker:
    TAFFISH_CONTAINER_BACKEND=docker \
    TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass

  Podman:
    TAFFISH_CONTAINER_BACKEND=podman \
    TAFFISH_PODMAN_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass

  Open after startup:
    http://127.0.0.1:8888/

  taf-higlass also prints this URL when it starts.

  Alternate host port:
    TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8890:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass --host-port 8890

  SSH tunnel:
    ssh -L 8888:127.0.0.1:8888 user@server

Service options:
  --host-port PORT   host port shown in the printed URL
  --version          show packaged component versions
  --help             show service helper help

Data and ingest:
  mkdir -p higlass-data higlass-tmp

  TAFFISH_CONTAINER_BACKEND=docker \
  TAFFISH_DOCKER_RUN_ARGS="-v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
  taf-higlass higlass-manage ingest_tileset \
    --filename /tmp/sample.multires.cool \
    --filetype cooler \
    --datatype matrix

  Start the service with the same /data and /tmp bindings to view ingested
  datasets. The first service start initializes the Django database in /data.

Recommended forms:
  taf-higlass -- --version
  taf-higlass higlass --version
  taf-higlass higlass --help
  taf-higlass higlass-manage help

Notes:
  - This app packages upstream higlass-docker v0.10.4.
  - Packaged components include higlass-server 1.14.8, higlass-app 1.1.11,
    higlass library 1.11.4, and clodius 0.19.0.
  - The standalone higlass JavaScript package has newer source tags, but this
    TAFFISH app follows the reproducible upstream Docker service distribution.
  - The helper prints the exact browser URL at startup.
  - Docker/Podman runs embed --init and --platform linux/amd64.
  - The upstream Docker image is amd64-only. Docker/Podman arm64 hosts use
    amd64 emulation; this is not native arm64 support.
  - Bind host ports to 127.0.0.1 unless you have explicit access control.
  - HiGlass is served over plain HTTP in this container; add TLS/auth outside
    the container for shared or public deployments.
  - Apptainer service use is site-dependent because ports, network policy, and
    amd64 support vary across clusters.

Container:
  image: ghcr.io/taffish/higlass:0.10.4-r1
  backends: apptainer, podman, docker
  native platform: linux/amd64
  arm64 Docker/Podman hosts: amd64 emulation through --platform linux/amd64

Upstream:
  source: https://github.com/higlass/higlass-docker
  homepage: https://higlass.io/
  release: https://github.com/higlass/higlass-docker/tree/v0.10.4
  image: docker://higlass/higlass-docker:0.10.4
  license: MIT
  citation: Kerpedjiev et al. 2018
  doi: 10.1186/s13059-018-1486-1
  pmid: 30143029
