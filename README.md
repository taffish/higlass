# taf-higlass

`higlass` packages [HiGlass](https://higlass.io/) as a local browser service for
TAFFISH.

Package identity:

- name: `higlass`
- command: `taf-higlass`
- kind: `tool`
- version: `2.3.5-r2`
- image: `ghcr.io/taffish/higlass:2.3.5-r2`
- license: Apache-2.0 for TAFFISH packaging; MIT for upstream HiGlass
- upstream: [higlass/higlass v2.3.5](https://github.com/higlass/higlass/tree/v2.3.5)

## What This App Packages

The image builds the official HiGlass frontend tag `v2.3.5` and serves it with
the pinned HiGlass server stack. It does not use the historical Docker Hub
`higlass/higlass-docker` image as a base or mix a legacy `higlass-app` bundle
with a newer library.

Packaged identities:

- HiGlass frontend: `v2.3.5`, commit `b35461175d6593aaa94147ec4885200c7f1f5e5a`
- HiGlass server: `1.14.8`, commit `cbfe79fe3ae0e844b4c0c78142a83733c8cc66a2`
- HiGlass Docker scaffold source: `v0.10.5`, commit `486514cc69c2a267c4210976daf6558b3e0653cc`
- clodius `0.19.0`, pandas `1.5.3`, numba `0.56.4`, llvmlite `0.39.1`
- frontend build: the small TAFFISH Vite viewer in this repository

Release `r2` is a same-upstream backend repair. It removes runtime writes to
the image-root `/data`, `/var/log`, `/var/run`, and nginx temporary paths,
adds explicit persistent-state binding, and supervises nginx and uWSGI as
critical child process groups with bounded signal cleanup.

## Scope

This app supports:

- a local HiGlass web UI and REST API;
- ingestion and listing through the packaged Django management CLI;
- persistent database, media, cache, and logs in an explicit host directory;
- ephemeral exploration without a persistent bind.

It does not provide TLS, authentication policy, a public deployment, a hosted
data catalog, or production-scale data preparation.

## Installation

After publication to the TAFFISH Hub:

```sh
taf update
taf install higlass 2.3.5-r2
```

## Common Use

Show wrapper and packaged helper help:

```sh
taf-higlass --help
taf-higlass higlass --help
taf-higlass higlass-manage help
taf-higlass -- --version
```

Create persistent state and run with Docker:

```sh
mkdir -p "$PWD/higlass-data"
TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
TAFFISH_CONTAINER_BACKEND=docker \
TAFFISH_DOCKER_RUN_ARGS="-p=127.0.0.1:8888:8000" \
taf-higlass --host-port 8888
```

Open `http://127.0.0.1:8888/app`. A mostly blank view with the top toolbar and
`no chromosome track present` is the valid initial state before tracks are
added. Press Ctrl-C to stop the session.

For a remote server, leave the container port on loopback and tunnel it:

```sh
ssh -L 8888:127.0.0.1:8888 user@server
```

## Backend Usage and Capability Matrix

All three backends were validated on native `linux/amd64`. Port publication is
a host/run policy rather than an app-intrinsic container requirement, so the
Docker and Podman examples use their corresponding single-run arguments.

| Capability | Docker | Podman | Apptainer | Validation and boundary |
| --- | --- | --- | --- | --- |
| Local browser service | `TAFFISH_DOCKER_RUN_ARGS="-p=127.0.0.1:8888:8000" taf-higlass --host-port 8888` | `TAFFISH_PODMAN_RUN_ARGS="-p=127.0.0.1:8888:8000" taf-higlass --host-port 8888` | `taf-higlass --host-port 8888` | PASS on native amd64; Apptainer uses host networking and binds its service to `127.0.0.1:8888` |
| Persistent state | Set `TAFFISH_HIGLASS_DATA_PATH` | Set `TAFFISH_HIGLASS_DATA_PATH` | Set `TAFFISH_HIGLASS_DATA_PATH` | PASS with an actual writable host bind to `/data`; the wrapper rejects unsafe or unwritable paths |
| Read-only image root | `/tmp` only when no data bind is present | `/tmp` only when no data bind is present | actual read-only SIF plus isolated `/tmp` | PASS; no marker variable can impersonate a bind |
| arm64 host | amd64 emulation via encoded `--platform linux/amd64` | amd64 emulation via encoded `--platform linux/amd64` | unsupported as a native claim | The published image is native `linux/amd64` only; Apptainer should run on native amd64 |

The app encodes the container user, internal service port/bind address, Docker
`--init`, Podman user namespace, amd64 platform, and optional `/data` mount in
`src/main.taf`. Podman does not require a host `catatonit`; the helper directly
supervises its children. Users do not need to repeat those intrinsic arguments.

## Inputs and Persistent State

HiGlass consumes prepared tiled genomic data. Common inputs include cooler or
multires cooler matrices, bigWig, bigBed, and other formats supported by the
pinned HiGlass server/clodius stack.

`TAFFISH_HIGLASS_DATA_PATH` must name an existing writable directory. For
portable backend argument construction, the current wrapper rejects paths that
contain whitespace, commas, colons, or glob characters.

The bind contains mutable, user-generated service state:

```text
higlass-data/db.sqlite3   Django catalog and stored view configurations
higlass-data/media/       staged or ingested data files
higlass-data/cache/       server cache
higlass-data/log/         service logs
```

This state is not a versioned third-party database/model/reference bundle.
There is no stable upstream resource unit for a download helper to resolve or
checksum, so the shared-resource downloader contract is not applicable. Users
choose and prepare scientific datasets, then preserve the mutable `/data`
directory. The app never downloads a default dataset during startup or smoke.

Example ingestion:

```sh
mkdir -p "$PWD/higlass-data/media"
cp sample.multires.cool "$PWD/higlass-data/media/"
TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
TAFFISH_CONTAINER_BACKEND=docker \
taf-higlass higlass-manage ingest_tileset \
  --filename /data/media/sample.multires.cool \
  --filetype cooler --datatype matrix --uid sample-matrix
```

List registered tilesets with the same data root:

```sh
TAFFISH_HIGLASS_DATA_PATH="$PWD/higlass-data" \
TAFFISH_CONTAINER_BACKEND=docker \
taf-higlass higlass-manage list_tilesets
```

State-changing management commands fail with status 64 unless `/data` is a
real writable mount. Read-only `help`, `version`, and `check` remain usable
without it.

## Browser Routes and Outputs

Useful routes:

```text
/app                  default local view configuration
/app?empty=1          empty editable viewer
/app?d=UID            stored view configuration
/app?viewconf=UID     same as d=UID
/app?config=URL       explicit external view-config URL
/app?config=URL&localOnly=1
                      rewrite that config's source servers to /api/v1
```

The browser can export the active view as SVG, PNG, JSON, or a link. Explicit
`config=URL` may access a remote server; startup, migrations, and declared
smoke remain offline. Use `localOnly=1` when external track-source rewriting
is required.

## Runtime Write Map and Lifecycle

With no `/data` bind, all database, media, cache, logs, pid files, sockets, and
nginx temporary paths live under a unique `/tmp/taf-higlass-runtime.*` tree and
are deleted at exit. With a real bind, database/media/cache/server logs persist
under `/data`; process-local nginx/uWSGI/launcher state still stays in the
unique `/tmp` tree.

The launcher prints the host URL, SSH tunnel, Ctrl-C instruction, log paths,
and data mode before migrations. It prints `ready` only after nginx, uWSGI,
the tileset API, default view config, and web app are all live. Either critical
child exiting causes a named failure, recent log output, cleanup, and non-zero
status. Each setup/service child owns an isolated process group, so orphaned
workers can be terminated even after their master exits. SIGINT exits 130;
SIGTERM exits 143; both use bounded group cleanup.

## Container and Image Size

The Dockerfile uses the repository root as the build context and a three-stage
build: Node frontend builder, Python/native-extension builder, and runtime-only
Ubuntu final stage. The final stage omits compilers, Git, development headers,
and supervisord. Runtime imports and uWSGI linkage were checked after pruning.

The final amd64 candidate is 1,054,060,902 bytes, down from 1,388,538,718 bytes
for `r1` (about 24.1% smaller). Its same-content Apptainer SIF is 333,193,216
bytes. Python runtime packages remain the dominant layer because HiGlass data
formats require scientific Python and native readers.

## Testing

Each declared command was run separately in a fresh offline container with a
read-only image root and only isolated temporary work space writable:

- Docker 26.1.5 on native amd64: PASS;
- rootless Podman 5.4.2 on native amd64: PASS;
- Apptainer 1.5.3 using an actual SIF made from the same candidate OCI: PASS.

The seven commands cover component identity, helper help, management-command
boundaries, scientific Python imports, full service endpoints, starting/ready
ordering, startup Ctrl-C=130, ready-state TERM=143, critical nginx failure,
read-only-root errors, and process-group/runtime cleanup. Separate wrapper-oriented
tests use actual host binds for persistent migration and service startup on all
three backends. Browser QA opened the real `/app`, expanded the configuration
menu, and opened the Add Track position chooser.

No backend exception is used. These checks validate packaging and a minimal
functional path, not scientific interpretation of a production Hi-C dataset.

## Security and Boundaries

HiGlass serves plain HTTP without an app-provided authentication or TLS layer.
Keep examples bound to `127.0.0.1`; use an SSH tunnel for remote personal use.
A shared deployment needs a site-managed reverse proxy, TLS, identity, access,
backup, and resource policy outside this app.

The packaged default view includes the upstream `higlass.io` source in its
configuration, but local startup does not require it. User-supplied view configs
and track sources can intentionally use the network.

## License and Citation

TAFFISH packaging files use Apache-2.0. HiGlass uses MIT. User datasets and
bundled third-party Python/JavaScript components retain their own terms.

Cite: Kerpedjiev et al. (2018), “HiGlass: web-based visual exploration and
analysis of genome interaction maps”, *Genome Biology* 19:125,
[doi:10.1186/s13059-018-1486-1](https://doi.org/10.1186/s13059-018-1486-1),
PMID 30143029.

Upstream manuals: [documentation](https://docs.higlass.io/),
[data preparation](https://docs.higlass.io/data_preparation.html), and
[server ingestion](https://docs.higlass.io/higlass_server.html).
