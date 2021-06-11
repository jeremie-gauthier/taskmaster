# Taskmaster

A supervisor-like CLI written in deno

## Installation

Follow the [deno instructions](https://deno.land/#installation)

## Run

You can run taskmaster locally or with Docker, pick one of the following methods

### With Docker

1. Build the image

   ```bash
   docker-compose build
   ```

2. Run the image

   ```bash
   docker-compose run --service-ports taskmasterd resources/valid/simple.json
   ```

To remove old images that were outdated by a new build, run:

```bash
docker image rm -f `docker images | grep '^<none>' | tr -s ' ' | cut -d ' ' -f 3`
```

### Locally

- Run the server with

  ```bash
  export TASKMASTER_TCP_PORT=9000 && deno run --allow-env --allow-read --allow-net --allow-run src/server.ts
  ```

- Run the client with

  ```bash
  export TASKMASTER_TCP_PORT=9000 && deno run --allow-env --allow-net src/client.ts
  ```

## Architecture

Project has 2 programs

- client.ts
- server.ts

The `client` offers an REPL in which to interact.

The `server` is a daemon, it receives user inputs, treat them and returns a
`JSON` response.

### Folder structure

- `lib/`
  - `commands/`

    Implements behaviour for all possible commands (start, stop, status...).

  - `config/`

    Allow interactions (parse, reload...) with the configuration file that must
    be passed when starting the server.

  - `process/`

    Register and keeps track of all processes. These ones are built from the
    configuration file.

  - `repl/`

    Provide a basic shell where to write and edit commands. Contains some extra
    features like command history.

  - `tcp/`

    Expose utilitary classes to trigger actions through TCP (listen, connect,
    read, write...).

  - `utils/`

    Expose generic util functions used by every other parts.

- `client.ts`
- `server.ts`
