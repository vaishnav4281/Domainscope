#!/bin/bash

# Exit on error
set -e

echo "🛡️ Setting up Firewall (UFW)..."

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    echo "❌ UFW not found. Installing..."
    sudo apt-get update && sudo apt-get install -y ufw
fi

# Reset UFW to default state
echo "🔄 Resetting UFW rules..."
sudo ufw --force reset

# Default Policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (Port 22) - CRITICAL
echo "🔓 Allowing SSH (Port 22)..."
sudo ufw allow 22/tcp

# Allow HTTP (Port 80)
echo "🔓 Allowing HTTP (Port 80)..."
sudo ufw allow 80/tcp

# Allow HTTPS (Port 443)
echo "🔓 Allowing HTTPS (Port 443)..."
sudo ufw allow 443/tcp

# Allow Node.js App (Port 3000) - Optional, usually proxied via Nginx
# sudo ufw allow 3000/tcp

# Enable Firewall
echo "✅ Enabling Firewall..."
sudo ufw --force enable

echo "🛡️ Firewall Status:"
sudo ufw status verbose
