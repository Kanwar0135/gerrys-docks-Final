# Gerry's Docks Azure CI/CD Setup

This project deploys five Docker images to Azure Kubernetes Service:

- `frontend`
- `product-service`
- `quote-service`
- `admin-service`
- `ai-service`

The GitHub Actions workflow is:

```text
GitHub push to main
-> build Docker images
-> push images to Azure Container Registry
-> update AKS deployments
-> wait for rollout
```

## Azure Resources

```text
Resource group: rg-anmol.kanwar1-3131
Azure Container Registry: gerrydocksacr
ACR login server: gerrydocksacr.azurecr.io
AKS cluster: gerrydocksaks
```

## Required GitHub Secrets

Add these secrets in GitHub:

```text
ACR_USERNAME
ACR_PASSWORD
KUBE_CONFIG_B64
```

Go to:

```text
GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret
```

## Create ACR Secrets

In Azure:

```text
Container Registry -> gerrydocksacr -> Access keys -> Admin user -> Enabled
```

Use:

```text
ACR_USERNAME = gerrydocksacr
ACR_PASSWORD = password or password2 from Access keys
```

## Create AKS Kubeconfig Secret

Run this locally after `az aks get-credentials` has already connected kubectl:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.kube\config")) | Set-Clipboard
```

Paste the clipboard value into:

```text
KUBE_CONFIG_B64
```

## How To Trigger Deployment

Push to `main`:

```powershell
git add .
git commit -m "Update Gerry's Docks deployment"
git push origin main
```

Then check:

```text
GitHub repo -> Actions -> Build and deploy to AKS
```

## What This Proves

The project has a working CI/CD pipeline. A code change pushed to GitHub automatically rebuilds container images, pushes them to ACR, and updates the AKS microservice deployments.
