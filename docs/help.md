taf-higlass 2.3.5-r1

TAFFISH wrapper for HiGlass, a browser-based genome data viewer for Hi-C
contact maps and other tiled genomic tracks.

Modes:
  service      starts the local HiGlass browser service on container port 80
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
  mkdir -p higlass-data higlass-tmp

  Docker:
    TAFFISH_CONTAINER_BACKEND=docker \
    TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass --host-port 8888

  Podman:
    TAFFISH_CONTAINER_BACKEND=podman \
    TAFFISH_PODMAN_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass --host-port 8888

  Open after startup:
    http://127.0.0.1:8888/app

  Alternate host port:
    TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8890:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass --host-port 8890

  SSH tunnel:
    ssh -L 8888:127.0.0.1:8888 user@server

Service helper options:
  --host-port PORT      host port shown in the printed URL
  --startup-timeout N   seconds to wait for service readiness
  --log-file FILE       internal supervisor log path
  --version             show packaged component versions
  --help                show service helper help

Browser routes:
  /app                  load the default server view config
  /app?empty=1          open an empty editable viewer
  /app?d=UID            load a stored view config from /api/v1/viewconfs/
  /app?viewconf=UID     same as d=UID
  /app?config=URL       load a view config JSON document from URL
  /app?config=URL&localOnly=1
                        load that config but rewrite source servers to /api/v1

Data and ingest:
  The service can start without host mounts, but useful HiGlass work needs a
  persistent /data directory for the Django database, media files, and logs.
  Host path mounts are not hardcoded into the app because local paths and port
  policy differ by machine and site. Use TAFFISH_DOCKER_RUN_ARGS or
  TAFFISH_PODMAN_RUN_ARGS for -v and -p options.

  mkdir -p higlass-data/media higlass-tmp
  cp sample.multires.cool higlass-data/media/

  TAFFISH_CONTAINER_BACKEND=docker \
  TAFFISH_DOCKER_RUN_ARGS="-v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
  taf-higlass higlass-manage ingest_tileset \
    --filename /data/media/sample.multires.cool \
    --filetype cooler \
    --datatype matrix \
    --uid sample-matrix

  Start the service with the same /data binding to view ingested datasets.
  In the browser, click the + button in the upper-right toolbar, choose a track
  position, select the local server tileset, and choose a compatible track type.

  List registered local tilesets:
    TAFFISH_CONTAINER_BACKEND=docker \
    TAFFISH_DOCKER_RUN_ARGS="-v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
    taf-higlass higlass-manage list_tilesets

  A mostly blank /app page is normal before tracks are added. If the top toolbar
  is visible and there is no red initialization error, the viewer is running.

Recommended commands:
  taf-higlass -- --version
  taf-higlass higlass --version
  taf-higlass higlass --help
  taf-higlass higlass-manage help

Learning:
  HiGlass documentation:
    https://docs.higlass.io/
  Tutorial:
    https://docs.higlass.io/tutorial.html
  Data preparation:
    https://docs.higlass.io/data_preparation.html
  Server and ingest_tileset:
    https://docs.higlass.io/higlass_server.html
  View configs:
    https://docs.higlass.io/view_config.html
  Views and tracks:
    https://docs.higlass.io/views.html

  When adapting upstream examples, use taf-higlass higlass-manage ... in place
  of direct manage.py or container commands, keep input files under mounted
  /data, and start the browser service with the same /data binding.

Notes:
  - This app builds a TAFFISH viewer from upstream higlass source tag v2.3.5.
  - Upstream v2.3.5 fixes a BedLikeTrack crash when itemRgb contains a
    comma-containing gene name instead of a numeric RGB triplet.
  - The old DockerHub higlass/higlass-docker image is not used as a base image.
  - The legacy higlass-app bundle is not mixed with newer hglib; this image uses
    a small source-built Vite viewer for the packaged hglib.
  - Packaged service components include higlass-server 1.14.8, the
    higlass-docker v0.10.5 service scaffold, clodius 0.19.0, pandas 1.5.3,
    numba 0.56.4, and llvmlite 0.39.1.
  - Docker/Podman runs embed --init and --platform linux/amd64.
  - Host ports and data mounts remain run-time choices supplied by the user.
  - The packaged service stack is validated for linux/amd64 only. Docker/Podman
    arm64 hosts use amd64 emulation; this is not native arm64 support.
  - Bind host ports to 127.0.0.1 unless you have explicit access control.
  - HiGlass is served over plain HTTP in this container; add TLS/auth outside
    the container for shared or public deployments.
  - Apptainer service use is site-dependent because ports, network policy, and
    amd64 support vary across clusters.

Container:
  image: ghcr.io/taffish/higlass:2.3.5-r1
  backends: apptainer, podman, docker
  native platform: linux/amd64
  arm64 Docker/Podman hosts: amd64 emulation through --platform linux/amd64

License:
  TAFFISH app packaging: Apache-2.0.
  Upstream software: MIT.
  Bundled components, data, models, and external resources keep their own
  license terms.

Upstream:
  source: https://github.com/higlass/higlass
  homepage: https://higlass.io/
  release: https://github.com/higlass/higlass/tree/v2.3.5
  source tag: v2.3.5
  upstream license: MIT
  citation: Kerpedjiev et al. 2018
  doi: 10.1186/s13059-018-1486-1
  pmid: 30143029
