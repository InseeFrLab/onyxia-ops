#!/bin/bash

# script pour copier les données de onyxia_kv d'un vault à l'autre
# s'execute dans un environnement avec le client VAULT et VAULT_TOKEN et VAULT_ADDR set sur l'ancien vault
# il faut passer NEW_VAULT_TOKEN et NEW_VAULT_ADDR en variable d'environnement au script
# pour l'instant tout ce qui contient des espaces est ignoré

vault_export() {
    for postfix in $(vault kv list $1 | tail -n +3 | grep /$ | grep -v \ )
    do
        vault_export $1$postfix
    done
    for secret in $(vault kv list $1 | tail -n +3 | grep -v /$ | grep -v \ )
    do
        echo migration de $1$secret
        vault kv get -format=json -field=data $1$secret | VAULT_TOKEN=$NEW_VAULT_TOKEN VAULT_ADDR=$NEW_VAULT_ADDR vault kv put $1$secret - > /dev/null
    done
}

vault_export onyxia-kv/
