import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { execSync } from 'child_process';

// 🧹 تنظيف أقفال الجلسة العالقة
try {
    execSync('find .wwebjs_auth/session -name "LOCK" -delete 2>/dev/null');
} catch (e) { }


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

client.on('qr', qr => {
    console.log('📷 امسح رمز QR لتسجيل الدخول ومعرفة القنوات:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ تم الاتصال بنجاح! جاري جلب القنوات...\n');

    try {
        const chats = await client.getChats();
        const channels = chats.filter(chat => chat.id._serialized.endsWith('@newsletter'));

        if (channels.length === 0) {
            console.log('⚠️ لم يتم العثور على أي قنوات (Newsletters) تتبعها.');
        } else {
            console.log('📋 القنوات التي تتبعها:');
            console.log('-------------------------');
            channels.forEach(channel => {
                console.log(`📌 الاسم: ${channel.name}`);
                console.log(`🆔 المعرف: ${channel.id._serialized}`);
                console.log('-------------------------');
            });
        }
    } catch (error) {
        console.error('❌ حدث خطأ أثناء جلب القنوات:', error.message);
    }

    console.log('\n✅ انتهى جلب القنوات الحالية. السكربت الآن في وضع "الانتظار" لالتقاط أي رسائل جديدة من القنوات...');
});

// 🔔 التقاط القنوات من الرسائل الجديدة
client.on('message', async msg => {
    if (msg.from.endsWith('@newsletter')) {
        let name = 'قناة غير معروفة (تفاصيل غير متاحة)';
        try {
            const allChats = await client.getChats();
            const channel = allChats.find(c => c.id._serialized === msg.from);
            if (channel) name = channel.name;
        } catch (error) { }

        console.log(`\n🔔 رسالة جديدة من قناة: ${name}`);
        console.log(`🆔 المعرف: ${msg.from}`);
        console.log(`💬 المحتوى: ${msg.body.substring(0, 50)}${msg.body.length > 50 ? '...' : ''}`);
        console.log('-------------------------');
    }
});

// 🔔 التقاط القنوات حتى لو كانت الرسالة من طرفك (إذا كنت آدمن مثلاً)
client.on('message_create', async msg => {
    if (msg.to.endsWith('@newsletter') && msg.fromMe) {
        let name = 'قناة غير معروفة (تفاصيل غير متاحة)';
        try {
            const allChats = await client.getChats();
            const channel = allChats.find(c => c.id._serialized === msg.to);
            if (channel) name = channel.name;
        } catch (error) { }

        console.log(`\n📤 رسالة مرسلة إلى قناة: ${name}`);
        console.log(`🆔 المعرف: ${msg.to}`);
        console.log('-------------------------');
    }
});

client.initialize();
