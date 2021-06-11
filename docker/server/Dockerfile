FROM denoland/deno:1.10.3

EXPOSE ${TASKMASTER_TCP_PORT}

COPY docker/server/entrypoint.sh /

WORKDIR /taskmaster

USER deno

COPY src /taskmaster/src

ENTRYPOINT [ "/entrypoint.sh" ]
