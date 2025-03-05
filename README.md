
# Onyxia CI Workflow action

Making changes:  

```bash
git clone https://github.com/InseeFrLab/paris-sspcloud paris-sspcloud-gh-actions
cd paris-sspcloud-gh-actions
git checkout gh-actions
yarn install

# ...Change the code...

# This command will generate the an updated ./index.js
# You must commit this file, it's what's been run by GitHub Actions.  
yarn build
```

## Usage  

This might not be up to date. It's just to give you the idea.  
For the actual usage see [the real workflow](https://github.com/InseeFrLab/paris-sspcloud/blob/main/.github/workflows/ci.yml).  

### From the Onyxia repo

Dispatch an event to paris-sspcloud when a release is created.  

`.github/workflows/dispatch_on_new_release.yml`
```yaml
on:
   release:
     types:
       - created  
  
jobs:
  
  notify_paris_sspcloud:
    runs-on: ubuntu-latest
    steps:
    - uses: peter-evans/repository-dispatch@v1
      with:
        repository: InseeFrLab/paris-sspcloud
        event-type: onyxia_release
        client-payload: '{"release_tag_name": "${{github.event.release.tag_name}}"}'
        token: ${{secrets.PAT_FOR_REPOSITORY_DISPATCH}}
```

### From the paris-sspcloud repo

`.github/workflows/automatic_update.yml`
```yaml
on:
  repository_dispatch:
    types: 
      - onyxia_release

permissions:
  contents: write

jobs:
  update_onyxia:
    runs-on: ubuntu-latest
    if: github.event.action == 'onyxia_release'  
    steps:
    - uses: InseeFrLab/paris-sspcloud@gh-actions
      with: 
        action_name: update_onyxia
        version: ${{github.event.client_payload.release_tag_name}}  
        onyxia_apps: 'onyxia onyxia-test'
        keycloak_apps: 'keycloakv2'
```