path "onyxia-kv/{{identity.entity.aliases.auth_jwt_fd8af65a.name}}/*" {
  capabilities = ["create","update","read","delete","list"]
}

path "onyxia-kv/data/{{identity.entity.aliases.auth_jwt_fd8af65a.name}}/*" {
  capabilities = ["create","update","read"]
}

path "onyxia-kv/metadata/{{identity.entity.aliases.auth_jwt_fd8af65a.name}}/*" {
  capabilities = ["delete", "list", "read"]
}
