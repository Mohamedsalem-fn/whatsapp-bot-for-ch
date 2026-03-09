import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { execSync } from 'child_process';

// 🧹 تنظيف أقفال الجلسة العالقة
// try {
//   execSync('find .wwebjs_auth/session -name "LOCK" -delete 2>/dev/null');
// } catch (e) { }

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote'],
    executablePath: process.env.CHROME_BIN || undefined
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

client.on('ready', async () => {
  console.log('ready');
  try {
    await client.sendMessage('120363405216072431@newsletter', 'رسالة تجريبية لتشخيص الخطأ');
    console.log('Message sent successfully!');
  } catch (e) {
    console.error('Error sending message:', e.message, e.stack);
  }
  process.exit(0);
});
client.initialize();
