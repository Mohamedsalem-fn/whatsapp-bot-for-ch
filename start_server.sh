#!/bin/bash

#=======================================================
# Script to run the WhatsApp bot continuously on a server
# using PM2 (Process Manager 2)
#=======================================================

echo "=== WhatsApp Bot Server Setup ==="

# 1. Install Node.js dependencies
echo "-> Installing npm dependencies..."
npm install

# 2. Install PM2 globally (requires sudo if not using nvm)
echo "-> Installing PM2 globally (the process manager)..."
npm install -g pm2

# 3. Stop any existing instance of the bot
echo "-> Stopping old instances if they exist..."
pm2 stop whatsapp-bot 2>/dev/null
pm2 delete whatsapp-bot 2>/dev/null

# 4. Start the bot using PM2
echo "-> Starting the WhatsApp Bot..."
pm2 start index.js --name "whatsapp-bot" --exp-backoff-restart-delay=100

# 5. Save the PM2 process list to start automatically on reboot
echo "-> Saving PM2 list..."
pm2 save

# 6. Setup PM2 to start on system boot
echo "-> Setting up script to run bot on server restart..."
pm2 startup

echo "======================================================="
echo "✅ Bot is now running continuously in the background!"
echo "======================================================="
echo "Useful PM2 Commands:"
echo " - View logs:       pm2 logs whatsapp-bot"
echo " - Monitor bot:     pm2 monit"
echo " - Stop bot:        pm2 stop whatsapp-bot"
echo " - Restart bot:     pm2 restart whatsapp-bot"
echo "======================================================="
