#!/bin/sh

# script d'initialisation des configurations Vault
# a executer dans le container que l'on veut configurer
# passer VAULT_TOKEN en variable d'environnement

# Authentification Kubernetes

vault auth enable kubernetes

vault write auth/kubernetes/config \
   token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
   kubernetes_host=https://${KUBERNETES_PORT_443_TCP_ADDR}:443 \
   kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt

# Authentification JWT

vault auth enable jwt

# Configuration d'un KV pour onyxia avec authentification jwt (attention a passer le fichier de policy)

vault write auth/jwt/config \
    oidc_discovery_url="https://auth.lab.sspcloud.fr/realms/sspcloud" \
    default_role="onyxia-user"

vault write auth/jwt/role/onyxia-user \
    role_type="jwt" \
    bound_audiences="vault" \
    user_claim="onyxia-username" \
    claim_mappings="/groups/0=group0,/groups/1=group1,/groups/2=group2,/groups/3=group3,/groups/4=group4,/groups/5=group5,/groups/6=group6,/groups/7=group7,/groups/8=group8,/groups/9=group9" \
    token_policies="onyxia-kv"

vault policy write onyxia-kv onyxia-kv-policy.hcl

vault secrets enable -path=onyxia-kv kv-v2
