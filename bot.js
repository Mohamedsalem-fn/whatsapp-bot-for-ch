import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import axios from 'axios';
import cron from 'node-cron';
import moment from 'moment-timezone';



const scheduledJobs = [];
function clearScheduledJobs() {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs.length = 0;
}


//////////-----------//////////
async function fetchData() {
  try {
    const response = await axios.get('https://frank0mm0m.serv00.net/api/azkar');
    const zekr = response.data['zekr'];
    const dua = response.data['dua'];
    return { zekr, dua };
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}




// ✅ Logger منسق باستخدام pino-pretty
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
      colorize: true
    }
  }
});

// ⚙️ إعداد العميل مع المصادقة المحلية
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// 🟡 QR
client.on('qr', qr => {
  console.log('📷 امسح رمز QR لتسجيل الدخول:');
  qrcode.generate(qr, { small: true });
});

// ⛔ فشل الاتصال
client.on('auth_failure', msg => {
  logger.error('❌ فشل في تسجيل الدخول:', msg);
});

// 🔁 إعادة الاتصال عند الانقطاع
client.on('disconnected', reason => {
  logger.warn('❌ تم قطع الاتصال، السبب:', reason);
});

const CHAT_ID = '120363400918914194@newsletter'; // معرف الدردشة الذي سيتم إرسال التذكيرات إليه

// Function to fetch prayer times
async function fetchPrayerTimes() {
  const date = moment().tz('Africa/Cairo').format('DD-MM-YYYY');
  const url = `http://api.aladhan.com/v1/timingsByCity/${date}?city=Cairo&country=Egypt&method=5`; // Method 5 for Egyptian General Authority of Survey
  try {
    const response = await axios.get(url);
    const timings = response.data.data.timings;
    console.log('✅ تم جلب مواقيت الصلاة بنجاح.');
    return timings;
  } catch (error) {
    logger.error('❌ فشل في جلب مواقيت الصلاة:', error.message);
    return null;
  }
}

function schedulePrayerReminders(prayerTimes) {
  if (!prayerTimes) {
    logger.warn('⚠️ لا توجد مواقيت صلاة لجدولة التذكيرات.');
    return;
  }

  clearScheduledJobs(); // 🧹 تنظيف المهام القديمة

  const prayers = {
    Fajr: 'الفجر',
    Sunrise: 'الشروق',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
    Midnight:'القيام',
  };

  for (const prayer in prayers) {
    const time = prayerTimes[prayer];
    if (time) {
      const [hours, minutes] = time.split(':');
      const cronTime = `${minutes} ${hours} * * *`;

      const job = cron.schedule(cronTime, async () => {
        const data = await fetchData(); // انتظر النتيجة
        const message = `${data.zekr}\n\nصلاة ${prayers[prayer]} ${data.dua}`;
        try {
          await client.sendMessage(CHAT_ID, message);
          console.log(`✅ تم إرسال تذكير ${prayers[prayer]} بنجاح.`);
        } catch (err) {
          logger.error(`❌ فشل في إرسال تذكير ${prayers[prayer]}:`, err.message);
        }
      }, {
        scheduled: true,
        timezone: "Africa/Cairo"
      });

      scheduledJobs.push(job);
      console.log(`تم جدولة تذكير ${prayers[prayer]} في ${time}`);
    }
  }

}
client.on('ready', async () => {
  console.log('✅ SUCCESS: تم الاتصال بنجاح!');

  // Fetch and schedule prayer times immediately on startup
  let prayerTimes = await fetchPrayerTimes();
  if (prayerTimes) {
    schedulePrayerReminders(prayerTimes);
  } else {
    logger.warn('⚠️ لم يتم جلب مواقيت الصلاة عند بدء التشغيل.');
  }

  // Schedule daily update of prayer times at midnight Cairo time
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 تحديث مواقيت الصلاة لليوم الجديد...');
    prayerTimes = await fetchPrayerTimes();
    if (prayerTimes) {
      schedulePrayerReminders(prayerTimes);
    } else {
      logger.error('❌ فشل في تحديث مواقيت الصلاة لليوم الجديد.');
    }
  }, {
    scheduled: true,
    timezone: "Africa/Cairo"
  });
  console.log('تم جدولة التحديث اليومي لمواقيت الصلاة.');
});

client.initialize();
