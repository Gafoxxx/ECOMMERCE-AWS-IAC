#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/home/ec2-user/repo/app}"
APP_NAME="${APP_NAME:-ecommerce-app}"

if ! command -v yum >/dev/null 2>&1; then
  echo "Este script esta pensado para Amazon Linux 2023 con yum." >&2
  exit 1
fi

curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git
sudo npm install -g pm2

cd "$APP_DIR"
npm install

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start index.js --name "$APP_NAME"
fi

pm2 save
