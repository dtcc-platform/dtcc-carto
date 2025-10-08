# Deployment Guide

Minimal steps to deploy the DTCC Cartography MVP on an Ubuntu EC2 instance.

## 1. Prerequisites

- Ubuntu 22.04 (or similar) EC2 host with:
  - Node.js ≥ 20
  - npm ≥ 10
  - Python 3.11
  - systemd available (default on Ubuntu)
- SSH access using the key stored as `EC2_SSH_KEY` GitHub secret.
- Optional domain + reverse proxy if you want public access.

## 2. GitHub Secrets

Configure these in your repository settings under **Settings → Secrets and variables → Actions**:

| Secret | Description |
| --- | --- |
| `EC2_HOST` | Public hostname or IP of the EC2 instance |
| `EC2_USER` | SSH user (e.g. `ubuntu`) |
| `EC2_SSH_KEY` | Private key for the above user |
| `EC2_DEPLOY_PATH` | Checkout directory on the instance (e.g. `/opt/dtcc-carto`) |
| `EC2_BACKEND_SERVICE` | Name of the backend systemd unit (`dtcc-backend.service`) |
| `EC2_FRONTEND_SERVICE` | Name of the frontend systemd unit (`dtcc-frontend.service`) |

## 3. First-Time Server Setup

```bash
sudo mkdir -p /opt/dtcc-carto
sudo chown ubuntu:ubuntu /opt/dtcc-carto   # replace with your SSH user
```

Install runtime dependencies:

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv nodejs npm
```

Clone the repository (the GitHub Action will sync over this path on later runs):

```bash
cd /opt
git clone https://github.com/your-org/dtcc-carto.git dtcc-carto
```

Copy the systemd unit files:

```bash
sudo cp /opt/dtcc-carto/systemd/dtcc-backend.service /etc/systemd/system/
sudo cp /opt/dtcc-carto/systemd/dtcc-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
```

## 4. Configure Environment

Create env files if needed:

```bash
cp /opt/dtcc-carto/frontend/.env.example /opt/dtcc-carto/frontend/.env
cp /opt/dtcc-carto/backend/.env.example /opt/dtcc-carto/backend/.env
```

Populate API keys or custom basemap URLs inside those files.

## 5. Deploy via GitHub Actions

- Push to `main`, or manually trigger “Deploy to EC2” workflow from the Actions tab.
- The workflow:
  1. Syncs the repository to `$EC2_DEPLOY_PATH`.
  2. Installs backend requirements into `backend/.venv`.
  3. Builds the frontend (`npm ci && npm run build`).
  4. Restarts `dtcc-backend.service` and `dtcc-frontend.service` if their names are provided in the secrets.

## 6. Manage Services

```bash
sudo systemctl status dtcc-backend
sudo systemctl status dtcc-frontend

sudo journalctl -u dtcc-backend -f
sudo journalctl -u dtcc-frontend -f
```

Use `systemctl stop` / `start` / `restart` as needed.

## 7. Optional Extras

- Place a reverse proxy (nginx/Caddy) in front if exposing to the internet.
- Enable HTTPS (e.g. using Let’s Encrypt).
- Configure CloudWatch or other monitoring for service uptime.

That’s it—future deployments only require pushing to `main` or rerunning the workflow.
