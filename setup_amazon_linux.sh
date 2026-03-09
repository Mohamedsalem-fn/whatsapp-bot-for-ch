#!/bin/bash

echo "=== 🚀 WhatsApp Bot Setup for Amazon Linux ==="

# 1. Update system
echo "-> Updating system packages..."
sudo yum update -y

# 2. Install Node.js if not installed
if ! command -v node &> /dev/null
then
    echo "-> Node.js not found. Installing Node.js..."
    # Amazon Linux 2023 and AL2 compatible Node.js installation
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
else
    echo "-> Node.js is already installed: $(node -version)"
fi

# 3. Install Puppeteer dependencies for Amazon Linux
# WhatsApp-web.js requires Chromium, which needs these system libraries to run headlessly
echo "-> Installing required system libraries for Chromium (Puppeteer)..."
sudo yum install -y \
    alsa-lib \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    pango \
    at-spi2-atk \
    libXt \
    xorg-x11-server-Xvfb \
    xorg-x11-xauth \
    dbus-glib \
    dbus-glib-devel \
    nss \
    mesa-libgbm

# 4. Install NPM dependencies for the bot
echo "-> Installing project NPM packages..."
npm install

# 5. Install PM2
if ! command -v pm2 &> /dev/null
then
    echo "-> Installing PM2 globally..."
    sudo npm install -g pm2
fi

# 6. Start the bot
echo "-> Starting the WhatsApp Bot using PM2..."
pm2 stop whatsapp-bot 2>/dev/null
pm2 delete whatsapp-bot 2>/dev/null
pm2 start index.js --name "whatsapp-bot"

# 7. Setup PM2 Startup (Runs bot automatically on server reboot)
echo "-> Configuring PM2 to start on boot..."
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))

echo "======================================================="
echo "✅ Setup Complete!"
echo "======================================================="
echo "⚠️ IMPORTANT: Please run the following command to view the QR Code and scan it from your WhatsApp:"
echo "pm2 logs whatsapp-bot"
echo "======================================================="
