# taf-higlass

TAFFISH wrapper for [HiGlass](https://higlass.io/), a browser-based viewer for
interactive exploration of Hi-C contact maps and other tiled genomic tracks.

This app packages the official [higlass-docker](https://github.com/higlass/higlass-docker)
`0.10.4` service image. That distribution bundles the web app, the Django-based
HiGlass server, nginx, uwsgi, and tile-ingest tooling in one container.

The packaged service components are:

```text
higlass-docker: 0.10.4
higlass-server: 1.14.8
higlass-app:    1.1.11
higlass library: 1.11.4
clodius:        0.19.0
```

The standalone `higlass` JavaScript package has newer source tags, but this
TAFFISH release follows the official Docker distribution because it is the
reproducible upstream service package.

## Installation

Install from the public TAFFISH Hub index:

```sh
taf update
taf install higlass
```

Install the exact release:

```sh
taf install higlass 0.10.4-r2
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

Show the TAFFISH package version:

```sh
taf-higlass --version
```

Start the HiGlass web service through Docker:

```sh
TAFFISH_CONTAINER_BACKEND=docker \
TAFFISH_DOCKER_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass
```

Then open:

```text
http://127.0.0.1:8888/
```

The helper prints this URL at startup, plus an SSH tunnel example for remote
servers.

Podman uses the same idea with the Podman run-args variable:

```sh
TAFFISH_CONTAINER_BACKEND=podman \
TAFFISH_PODMAN_RUN_ARGS="-p 127.0.0.1:8888:80 -v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass
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

## Data And Ingest

HiGlass is a server for prepared tiled datasets. The official image includes
`higlass-server/manage.py`, `clodius`, `cooler`-oriented ingest support, and
related Python dependencies from the upstream Docker distribution.

Use persistent host directories for `/data` and `/tmp` when you want uploaded or
ingested datasets to survive the TAFFISH one-shot container:

```sh
mkdir -p higlass-data higlass-tmp
```

Place input files under the host directory mapped to `/tmp`, then use the
`higlass-manage` helper through command mode:

```sh
TAFFISH_CONTAINER_BACKEND=docker \
TAFFISH_DOCKER_RUN_ARGS="-v \"$PWD/higlass-data:/data\" -v \"$PWD/higlass-tmp:/tmp\"" \
taf-higlass higlass-manage ingest_tileset \
  --filename /tmp/sample.multires.cool \
  --filetype cooler \
  --datatype matrix
```

Start the web service with the same `/data` and `/tmp` bindings to view the
tileset.

The first service start initializes the Django database in `/data`. For advanced
administration, command mode can call other Django management commands:

```sh
taf-higlass higlass-manage help
taf-higlass higlass-manage migrate
```

## Package

```text
name: higlass
command: taf-higlass
version: 0.10.4-r2
kind: tool
image: ghcr.io/taffish/higlass:0.10.4-r2
upstream: higlass-docker v0.10.4
runtime components: higlass-server 1.14.8, higlass library 1.11.4
native platform: linux/amd64
```

## Container

The container image is built from `docker/Dockerfile`. It starts from the
official `higlass/higlass-docker:0.10.4` image and adds two TAFFISH-friendly
helpers:

```text
higlass          starts the browser service and prints the host URL
higlass-manage   runs /home/higlass/projects/higlass-server/manage.py
```

The original service stack remains upstream's nginx + uwsgi + supervisord
layout. The app helper hides routine supervisor logs in `/tmp/higlass-supervisord.log`
and lets Ctrl-C stop the service session.

The image is built and validated for:

```text
linux/amd64
```

The official upstream Docker image is amd64-only. On arm64 Docker/Podman hosts,
including Apple Silicon machines, the `<taf-app:...>` entry requests
`--platform linux/amd64` so the same app can run through Docker/Podman amd64
emulation. This is a compatibility path, not native `linux/arm64` support.

The `<taf-app:...>` entry also embeds `--init` for Docker and Podman so the
long-running service receives signals and cleans up child processes more
reliably.

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

This app packages the official all-in-one HiGlass Docker service. It does not
rebuild the newer standalone `higlass` JavaScript package from source, and it
does not include a site-specific catalog, public data mirror, authentication
layer, TLS certificates, scheduler integration, or a persistent named Docker
container.

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
test:  packaged component versions are pinned
test:  helper help text is available
test:  Django management commands are reachable
test:  the HiGlass service starts and /api/v1/tilesets/ responds
test:  the user-facing localhost URL is printed
```

These checks validate the packaged service stack and browser access path. They
do not replace manual testing with real Hi-C/cooler datasets.

## License Boundary

The TAFFISH app packaging files are licensed under Apache-2.0. The packaged upstream HiGlass software is covered by: MIT. Bundled third-party components, datasets, models, and external resources keep their own license terms.

## Upstream

```text
project: HiGlass Docker
homepage: https://higlass.io/
source:   https://github.com/higlass/higlass-docker
release:  https://github.com/higlass/higlass-docker/tree/v0.10.4
image:    docker://higlass/higlass-docker:0.10.4
upstream license: MIT
citation: Kerpedjiev et al. 2018, HiGlass: web-based visual exploration and analysis of genome interaction maps
doi:      10.1186/s13059-018-1486-1
pmid:     30143029
```
