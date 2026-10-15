# Vault Helm Chart

Chart helm de vault déployé par ArgoCD et exposé sur vault.kub.sspcloud.fr

L'initialisation du Vault doit se faire à la main dans le pod après avoir été lancé une première fois par argocd.

## Activation de l'auto-unseal de GCP

https://www.vaultproject.io/docs/configuration/seal/gcpckms.html#vault\_gcpckms\_seal\_crypto\_key
https://learn.hashicorp.com/tutorials/vault/autounseal-gcp-kms 

On utilise GCP pour que lorsque le vault se scelle (redémarrage du pod, etc) celui-ci puisse récupérer sa master key et se desceller sans action manuelle.

* création d'un keyring dans GCP KMS (vault-datalab-sspcloud) avec une clé maîtresse (vault-master-key)
* création d'un service account permettant l'utilisation de la clé maîtresse (vault-sspcloud : roles/cloudkms.cryptoKeyEncrypterDecrypter et publickeyViewer (?) )
* ajout du json du service account en tant que secret kubernetes (kubectl create secret generic vault-gcp-account --from-file=vault-gcp-account.json -n vault)

Les values du chart Helm montent le secret comme un volume et passe les arguments nécessaires à la configuration de gcpckms en variable d'environnement.

## Initialisation

* kubectl apply -f argocd-applications.yaml -n argocd
* kubectl exec -it vault-0 -n vault -- /bin/sh
* Dans le pod : vault operator init -recovery-shares=1 -recovery-threshold=1

Il faudra compléter par un script de configuration des secret engine, auth engine, policies, etc...

## Configuration

Un script d'initialisation de la configuration permet d'initialiser l'authentification kubernetes et jwt et de permettre à onyxia l'accès au secret engine KV.

* kubectl cp scripts/config vault-0:/vault/ -n vault
* kubectl exec -it vault-0 -n vault -- /bin/sh
* cd /vault/scripts/config
* VAULT_TOKEN=<token aux droits adaptés> ./config.sh

## Migration

Un script de migration permet de copier les secrets d'un ancien KV vault à un nouveau KV vault.

* on suppose que le script est exécuté dans un environnement où VAULT_ADDR et VAULT_TOKEN sont configurés pour lire les secrets de l'ancien vault
* NEW_VAULT_ADDR=<nouvelle addresse de vault> NEW_VAULT_TOKEN=<nouveau token> ./scripts/migration/export.sh

