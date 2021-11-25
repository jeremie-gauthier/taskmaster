# Taskmaster

A supervisor-like CLI written in deno

## Installation

Follow the [deno instructions](https://deno.land/#installation)

Then take the 1.13.2 version:

```bash
deno upgrade --version 1.13.2
```

## Run

You can run taskmaster locally or with Docker, pick one of the following methods

### Locally

- Run the server with

  ```bash
  TASKMASTER_TCP_PORT=9000 deno run --allow-env --allow-write --allow-read --allow-net --allow-run --unstable src/server.ts resources/simple.json
  ```

- Run the client with

  ```bash
  TASKMASTER_TCP_PORT=9000 deno run --allow-env --allow-net --unstable src/client.ts
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

### Features

- [x] La configuration doit être rechargeable pendant que taskmaster est en
      train de tourner en lui envoyant un SIGHUP
- [x] Votre programme doit avoir un système de registres afin d’enregistrer les
      évènementsdans un fichier local

Le shell devra au moins autoriser l’utilisateur à :

- [x] Voir le statut de tous les programmes décris dans le fichier de
      configuration (avec la commande "status")
- [x] Lancer les programmes
- [x] Arrêter les programmes
- [x] Relancer les programmes
- [x] Recharger le fichier de configuration sans que le programme principal
      s’arrête
- [x] Arrêter le programme principal

Le fichier de configuration doit autoriser l’utilisateur à spécifier ce qui
suit, pour chaque programme cela doit être supervisé :

- [x] La commande à utiliser pour lancer le programme
- [x] Le nombre de processus à lancer et laisser tourner
- [x] Choisir de lancer ce programme au démarrage ou non
- [x] Choisir si le programme doit toujours être relancé, jamais, ou uniquement
      lorsqu’ils’arrête de manière innatendue
- [x] Quel code de retour represente une sortie "attendue" du programme
- [x] Combien de temps le programme doit-il tourner après son démarrage pour
      quel’on considère qu’il s’est "lancé correctement"
- [x] Combien de fois un redémarrage doit être réalisé avant de s’arrêter
- [x] Quel signal doit être utilisé pour arrêter (i.e. exit gracefully) le
      programme
- [x] Combien de temps d’attente après un graceful stop avant de kill le
      programme
- [x] Options pour retirer les stdout du programme ou pour rediriger vers des
      fichiers
- [x] Options pour retirer les stderr du programme ou pour rediriger vers des
      fichiers
- [x] Des variables d’environnement a set avant de lancer le programme
- [x] Un répertoire de travail a set avant de lancer le programme
- [x] Un umask a set avant de lancer le programme

### Bonuses

- [x] Gestion des process par groupe
- [x] Architecture client / serveur
- [x] Système de log avancé
- [x] Commande Help
- [x] Commande Exit
