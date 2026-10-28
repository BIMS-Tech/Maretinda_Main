#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 droplet. Run as root:
#
#   scp deploy/scripts/bootstrap-server.sh root@<droplet-ip>:
#   ssh root@<droplet-ip> bash bootstrap-server.sh
#
# Test server (Oracle Cloud, no nightly backups into the production bucket):
#
#   ssh ubuntu@<ip> sudo MARETINDA_ENV=test bash bootstrap-server.sh
#
# Safe to re-run. Creates the `deploy` user that CI logs in as.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive
# A new droplet runs cloud-init and unattended-upgrades for its first minutes,
# holding the apt lock; wait for them instead of failing.
cloud-init status --wait > /dev/null 2>&1 || true
while fuser /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock > /dev/null 2>&1; do
  echo "waiting for another apt process to finish..."
  sleep 10
done
apt-get update
apt-get -y upgrade
apt-get -y install ca-certificates curl unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# Docker Engine + compose plugin from Docker's official repository
if ! command -v docker > /dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

# Without rotation, container logs grow until the disk is full
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
systemctl restart docker

# Oracle Cloud's Ubuntu images ship iptables rules that reject everything but
# SSH, on top of the VCN security list. Open 80/443 ahead of the REJECT rule
# and persist it; other providers have no such rules file.
if [ -f /etc/iptables/rules.v4 ] && grep -q -- '-j REJECT' /etc/iptables/rules.v4; then
  for port in 80 443; do
    iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2> /dev/null \
      || iptables -I INPUT 5 -p tcp --dport "$port" -m state --state NEW -j ACCEPT
  done
  netfilter-persistent save
fi

# 2 GB swap: headroom for memory spikes on a 4 GB droplet
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

# Deploy user: same SSH keys as root, may run docker, no password
if ! id deploy > /dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# Under sudo (Oracle's `ubuntu` user) copy that user's keys: Oracle prefixes
# root's keys with a command that refuses the login
KEYS=/root/.ssh/authorized_keys
if [ -n "${SUDO_USER:-}" ] && [ -f "/home/$SUDO_USER/.ssh/authorized_keys" ]; then
  KEYS="/home/$SUDO_USER/.ssh/authorized_keys"
fi
if [ -f "$KEYS" ]; then
  cat "$KEYS" >> /home/deploy/.ssh/authorized_keys
  sort -u -o /home/deploy/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
fi

# Key-only SSH
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh

install -d -o deploy -g deploy /opt/maretinda /opt/maretinda/scripts /opt/maretinda/certs /var/backups/maretinda
chmod 700 /opt/maretinda/certs

# Nightly backup at 19:00 UTC (03:00 Manila). Not on the test server: its
# data is a scrubbed copy of production, and the backup bucket is production's.
if [ "${MARETINDA_ENV:-production}" != test ]; then
  CRON='0 19 * * * /opt/maretinda/scripts/backup-db.sh >> /var/backups/maretinda/backup.log 2>&1'
  ( crontab -u deploy -l 2> /dev/null | grep -v backup-db.sh || true; echo "$CRON" ) | crontab -u deploy -
fi

echo
echo "Server ready. Next: copy the deploy/ folder to /opt/maretinda and add .env, backend.env and certs/ (see deploy/README.md)."
