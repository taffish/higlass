# taf-higlass

TAFFISH wrapper for [HiGlass](https://higlass.io/), a browser-based genome
data viewer for Hi-C contact maps and other tiled genomic tracks.

This release follows the "current upstream source" route. It builds a small
TAFFISH web viewer directly from official
[higlass/higlass](https://github.com/higlass/higlass) tag `v2.3.5` with Vite,
then serves it with a pinned HiGlass server stack. It does not inherit the old
DockerHub `higlass/higlass-docker` image, and it no longer mixes the legacy
`higlass-app` bundle with a newer `hglib`.

Release `2.3.5-r1` updates only the HiGlass frontend source tag. Upstream
`v2.3.5` fixes a BedLikeTrack crash when an `itemRgb` field contains a
comma-containing gene name instead of a numeric RGB triplet.

Packaged components:

```text
higlass frontend source:        v2.3.5
higlass frontend commit:        b35461175d6593aaa94147ec4885200c7f1f5e5a
frontend build:                 taffish-vite-viewer
higlass-server:                 1.14.8
higlass-server commit:          cbfe79fe3ae0e844b4c0c78142a83733c8cc66a2
higlass-docker service scaffold: v0.10.5
higlass-docker commit:          486514cc69c2a267c4210976daf6558b3e0653cc
clodius:                        0.19.0
pandas:                         1.5.3
numba/llvmlite:                 0.56.4 / 0.39.1
```

The `higlass-docker` repository is used only as a pinned source for nginx,
uwsgi, supervisord, and default server configuration files.

## Installation

Install from the public TAFFISH Hub index:

```sh
taf update
taf install higlass
```

Install the exact release:

```sh
taf install higlass 2.3.5-r1
```

For local testing before the app is published to the public index:

```sh
taf install --from .
```

## Usage

Show TAFFISH app help:

```sh
taf-higlass --help
```

Show packaged component versions:

```sh
taf-higlass -- --version
```

Start the HiGlass web service through Docker:

```sh
mkdir -p higlass-data higlass-tmp

TAFFISH_CONTAINER_BACKEND=docker \
TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass --host-port 8888
```

Then open:

```text
http://127.0.0.1:8888/app
```

The first page can look almost empty. That is expected until a view config or
tileset has been loaded. A normal blank starting state usually still has the
HiGlass toolbar at the top and may say `no chromosome track present`; it means
the browser viewer is running, not that the app failed.

Podman uses the same pattern:

```sh
mkdir -p higlass-data higlass-tmp

TAFFISH_CONTAINER_BACKEND=podman \
TAFFISH_PODMAN_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass --host-port 8888
```

Use another host port if `8888` is already occupied:

```sh
TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8890:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass --host-port 8890
```

For a remote server:

```sh
ssh -L 8888:127.0.0.1:8888 user@server
```

Then open the same localhost URL in your local browser.

## Browser Routes

The packaged viewer is intentionally small and local-service oriented:

```text
/app                 load the default server view config
/app?empty=1         open an empty editable viewer
/app?d=UID           load a stored view config by uid from /api/v1/viewconfs/
/app?viewconf=UID    same as d=UID
/app?config=URL      load a view config JSON document from URL
/app?config=URL&localOnly=1
                     load that config but rewrite source servers to /api/v1
```

Default and stored configs use the local server as their track source. Explicit
`?config=URL` inputs are respected by default because users sometimes need to
inspect an existing HiGlass view config that points to a remote tile server.

## What To Do After Startup

HiGlass is a browser service plus a tileset database. A useful local session
usually follows this path:

```text
prepare or obtain tiled data -> ingest_tileset -> start service -> open /app -> add track
```

For example, after ingesting a cooler matrix as `sample-matrix`, start the
service, open `/app`, click the `+` button in the upper-right toolbar, choose a
track position, select the local server tileset, and choose a compatible matrix
track type. If the view is still empty, check that the same persistent `/data`
directory was used for both `ingest_tileset` and service startup.

Use this command to list tilesets already registered in the mounted `/data`
database:

```sh
TAFFISH_CONTAINER_BACKEND=docker \
TAFFISH_DOCKER_RUN_ARGS="-v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass higlass-manage list_tilesets
```

## Data And Mounts

HiGlass is useful only when the server can see prepared tiled datasets and keep
a persistent database. The container can start without host mounts, but any
anonymous container data will disappear after the TAFFISH run ends. For real
work, mount persistent host directories to `/data` and `/tmp`.

Host bind mounts are intentionally not hardcoded into `src/main.taf`. Local
paths, port bindings, site policy, and whether data should be read-only or
writable are run-time decisions, so they belong in
`TAFFISH_DOCKER_RUN_ARGS` or `TAFFISH_PODMAN_RUN_ARGS`.

Recommended layout:

```text
higlass-data/        persistent Django database, media files, and server logs
higlass-tmp/         temporary files and optional input staging
```

Example ingest with a cooler matrix:

```sh
mkdir -p higlass-data/media higlass-tmp
cp sample.multires.cool higlass-data/media/

TAFFISH_CONTAINER_BACKEND=docker \
TAFFISH_DOCKER_RUN_ARGS="-v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass higlass-manage ingest_tileset \
  --filename /data/media/sample.multires.cool \
  --filetype cooler \
  --datatype matrix \
  --uid sample-matrix
```

Start the service with the same `/data` binding to view the ingested tileset.
For advanced administration, command mode can call other Django management
commands:

```sh
taf-higlass higlass-manage help
taf-higlass higlass-manage migrate
```

## Learning HiGlass

This TAFFISH app keeps the service local and reproducible; it does not replace
the upstream HiGlass manuals. Recommended upstream reading:

- [HiGlass documentation](https://docs.higlass.io/)
- [HiGlass tutorial](https://docs.higlass.io/tutorial.html)
- [Data preparation](https://docs.higlass.io/data_preparation.html)
- [HiGlass server and `ingest_tileset`](https://docs.higlass.io/higlass_server.html)
- [View configs](https://docs.higlass.io/view_config.html)
- [Views and tracks](https://docs.higlass.io/views.html)

When adapting upstream examples to TAFFISH, replace direct container commands
with `taf-higlass higlass-manage ...`, keep input files under the mounted
`/data` path, and start the service with the same `/data` binding.

## Package

```text
name: higlass
command: taf-higlass
version: 2.3.5-r1
kind: tool
image: ghcr.io/taffish/higlass:2.3.5-r1
upstream: HiGlass v2.3.5 source
native platform: linux/amd64
```

## Container

The image is built from `docker/Dockerfile`. It uses a two-stage build:

```text
frontend stage: node:22-bookworm builds the v2.3.5 HiGlass viewer
runtime stage:  ubuntu:20.04 runs higlass-server, nginx, uwsgi, supervisord
```

TAFFISH helpers:

```text
higlass          starts the browser service and prints the host URL
higlass-manage   runs /home/higlass/projects/higlass-server/manage.py
```

The service stack remains the upstream nginx + uwsgi + supervisord layout. The
`higlass` helper waits until `/api/v1/tilesets/`, `/api/v1/viewconfs/?d=default`,
and `/app` respond before printing the ready URL. On startup failure it prints
the relevant service logs.

The image is built and validated for:

```text
linux/amd64
```

On arm64 Docker/Podman hosts, including Apple Silicon machines, the
`<taf-app:...>` entry requests `--platform linux/amd64` so the same app can run
through Docker/Podman amd64 emulation. This is a compatibility path, not native
`linux/arm64` support.

The Dockerfile exposes `UBUNTU_MIRROR` and `PIP_INDEX_URL` build arguments for
maintainers who need regional mirrors.

The upstream `higlass-server 1.14.8` requirements still carry old pins for
`numba`, `numpy`, and `clodius`. This image keeps the server version fixed but
installs compatible Python 3.8 pins for the service runtime: `numpy 1.22.1`,
`pandas 1.5.3`, `numba 0.56.4`, `llvmlite 0.39.1`, and `clodius 0.19.0`.
Additional service support packages are also pinned in the Dockerfile,
including `pysam 0.24.0`, `uWSGI 2.0.31`, `SciPy 1.10.1`, `pyBigWig 0.3.22`,
and the `wait-for-it` helper commit used by the upstream service scaffold.

The `<taf-app:...>` entry embeds `--init` for Docker and Podman so the
long-running service receives signals and cleans up child processes more
reliably. It also embeds `--platform linux/amd64`; host ports and host data
mounts remain user-provided run arguments.

## Security And Ports

The documented examples bind the host port to `127.0.0.1`, not all network
interfaces. This is the safest default for local work and SSH tunneling.

HiGlass is served over plain HTTP inside the container. The local TAFFISH helper
does not add authentication or TLS. If a site needs shared access, HTTPS,
single sign-on, or external network exposure, put those controls outside the
container with a site-level reverse proxy or access policy.

The Django admin interface is available under `/admin/` after an admin user is
created in a persistent `/data` volume, but routine visualization does not
require admin access.

## Boundaries

This app packages the latest verified HiGlass browser source tag with the
current HiGlass server tag and a pinned service scaffold. It does not include a
site-specific catalog, public data mirror, authentication layer, TLS
certificates, scheduler integration, or a persistent named Docker container.

Large data preparation remains a user workflow. The packaged server can ingest
supported files through `higlass-manage`, but production-scale data staging,
cloud credentials, and long-running service deployment should be handled by the
site or by a future dedicated flow.

Apptainer support for browser services is site-dependent because port exposure,
network policy, and amd64 emulation vary across clusters.

## Smoke

The TAFFISH metadata declares Docker smoke checks that verify:

```text
exist: higlass, higlass-manage, supervisord, nginx, uwsgi, python, curl
test:  packaged component versions and pinned commits are reported
test:  helper help text is available
test:  Django management commands are reachable
test:  clodius/cooler/pandas/numba import successfully
test:  the service starts and /api/v1/tilesets/ responds
test:  /api/v1/viewconfs/?d=default and /app respond
test:  the user-facing localhost /app URL is printed
```

These checks validate the packaged service stack and browser access path. They
do not replace manual testing with real Hi-C/cooler datasets.

## License Boundary

The TAFFISH app packaging files are licensed under Apache-2.0. The packaged
upstream HiGlass software is covered by MIT. Bundled third-party components,
datasets, models, and external resources keep their own license terms.

## Upstream

```text
project: HiGlass
homepage: https://higlass.io/
source:   https://github.com/higlass/higlass
release:  https://github.com/higlass/higlass/tree/v2.3.5
source commit: b35461175d6593aaa94147ec4885200c7f1f5e5a
upstream license: MIT
citation: Kerpedjiev et al. 2018, HiGlass: web-based visual exploration and analysis of genome interaction maps
doi:      10.1186/s13059-018-1486-1
pmid:     30143029
```
