FROM denoland/deno:1.10.3

EXPOSE ${TASKMASTER_TCP_PORT}

COPY docker/server/entrypoint.sh /

WORKDIR /taskmasterd

USER deno

COPY src /taskmasterd/src

ENTRYPOINT [ "/entrypoint.sh" ]
