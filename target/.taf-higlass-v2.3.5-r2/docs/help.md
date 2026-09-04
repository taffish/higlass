taf-higlass 2.3.5-r2

Purpose:
  Run a local HiGlass browser viewer and manage its tileset catalog.

Usage:
  taf-higlass [SERVICE-OPTIONS]
  taf-higlass higlass-manage COMMAND [OPTIONS...]
  taf-higlass -- --version

Start with persistent state:
  mkdir -p "$PWD/higlass-data"

  Docker:
    TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
    TAFFISH_CONTAINER_BACKEND=docker \
    TAFFISH_DOCKER_RUN_ARGS="-p=127.0.0.1:8888:8000" \
    taf-higlass --host-port 8888

  Podman:
    TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
    TAFFISH_CONTAINER_BACKEND=podman \
    TAFFISH_PODMAN_RUN_ARGS="-p=127.0.0.1:8888:8000" \
    taf-higlass --host-port 8888

  Apptainer on a native amd64 host:
    TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
    TAFFISH_CONTAINER_BACKEND=apptainer \
    taf-higlass --host-port 8888

  Open http://127.0.0.1:8888/app after "HiGlass is ready."
  On a remote server, first run:
    ssh -L 8888:127.0.0.1:8888 user@server

Ephemeral preview:
  Use the same backend command without TAFFISH_HIGLASS_DATA_PATH.
  Database, media, cache, and logs then disappear when the run ends.

Ingest a prepared cooler file:
  mkdir -p "$PWD/higlass-data/media"
  cp sample.multires.cool "$PWD/higlass-data/media/"
  TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
  TAFFISH_CONTAINER_BACKEND=docker \
  taf-higlass higlass-manage ingest_tileset \
    --filename /data/media/sample.multires.cool \
    --filetype cooler --datatype matrix --uid sample-matrix

List registered tilesets:
  TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
  TAFFISH_CONTAINER_BACKEND=docker \
  taf-higlass higlass-manage list_tilesets

Service options:
  --host-port PORT      Host port printed in the browser URL.
  --startup-timeout N   Readiness timeout in seconds.
  --log-file FILE       Launcher log path inside this run.
  --version             Show packaged component identities.
  --help                Show service-helper help.

Immediate notes:
  State-changing higlass-manage commands require a real writable data bind.
  TAFFISH_HIGLASS_DATA_PATH must already exist, be writable, and contain no
  whitespace, comma, colon, or glob characters.
  Docker/Podman arm64 hosts use encoded amd64 emulation; this is not native
  arm64 support. Use Apptainer on a native amd64 host.
  Bind ports to 127.0.0.1; this app provides neither TLS nor authentication.
  A blank viewer with the toolbar and "no chromosome track present" is normal.
  Press Ctrl-C to stop; the wrapper reports shutdown and cleans child processes.

More help:
  taf-higlass higlass --help
  taf-higlass higlass-manage help
  https://docs.higlass.io/
  https://github.com/taffish/higlass#readme

Wrapper options:
  taf-higlass --help       Show this TAFFISH help.
  taf-higlass --version    Show TAFFISH wrapper version.
  taf-higlass --compile    Print the generated wrapper shell.
  taf-higlass -- --version Show packaged HiGlass component versions.
