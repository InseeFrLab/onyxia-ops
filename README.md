<p align="center">
    <i>✨ Onyxia Datalab GitOps Repository ✨</i>
    <br>
    <br>
	<img src="https://github.com/garronej/onyxia-ops/assets/6702424/a348abac-0857-46a2-a689-479773f6144f">
</p>

Template repository for deploying and managing Onyxia Datalab instances via ArgoCD and GitOps. Contains essential configurations and manifests, designed to be forked as a private repo and tailored to specific environments for consistent, automated management.  

This template assumes you have followed the Kubernetes setup described in the [Onyxia installation instruction](https://docs.onyxia.sh).

> Don't forget to search and replace "oidc-spa.dev" by your actual domain!  

## Install ArgoCD  

This is the script to run to install ArgoCD on your cluster.  

```bash
helm repo add automation https://inseefrlab.github.io/helm-charts-automation

cat << EOF > ./argocd-values.yaml
ingress:
  enabled: true
  hostname: argocd.lab.oidc-spa.dev
  ingressClassName: onyxia
secret:
  password: changeme-argocd
EOF

helm install argocd automation/argo-cd -f values.yaml
```


