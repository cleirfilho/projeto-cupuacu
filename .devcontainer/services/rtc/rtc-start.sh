#!/bin/sh
set -eu

banco="/rtc-data/$1"
if [ ! -e "$banco" ]; then
    temporario=$(mktemp "$banco.XXXXXX")
    trap 'rm -f -- "$temporario"' EXIT
    install -m 0444 /app/catalogo-inicial.sqlite "$temporario"
    mv -n -- "$temporario" "$banco"
    rm -f -- "$temporario"
    trap - EXIT
fi

ln -sfn "$banco" /app/calculadora/db/calculadora-pro.db
exec setpriv --reuid=10001 --regid=10001 --clear-groups java -jar /app/application.jar
