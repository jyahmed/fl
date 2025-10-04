// هذا الكود يعمل على الخادم (Vercel)، وليس في المتصفح

// لاستخدام مكتبة لإجراء طلبات HTTP (مثل axios أو node-fetch)
// سنحتاج إلى تثبيتها. افتح الطرفية (terminal) في مجلد verifyway-proxy
// وقم بتشغيل: npm install node-fetch
const fetch = require('node-fetch');

// الدالة الرئيسية التي ستتعامل مع الطلبات
module.exports = async (req, res) => {
  // تأكد من أن الطلب هو POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. احصل على رقم الهاتف من جسم الطلب القادم من تطبيق Flutter
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // 2. احصل على مفتاح API بأمان من متغيرات البيئة في Vercel
    const apiKey = process.env.VERIFYWAY_API_KEY;

    // 3. أنشئ رمز OTP على الخادم
    const otp = (100000 + Math.floor(Math.random() * 900000)).toString();

    // 4. قم باستدعاء VerifyWay API من الخادم
    const verifyWayResponse = await fetch('https://api.verifyway.com/api/v1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        recipient: phoneNumber,
        type: 'otp',
        code: otp,
        channel: 'whatsapp',
        lang: 'ar',
      } ),
    });

    const responseData = await verifyWayResponse.json();

    // تحقق من استجابة VerifyWay
    if (!verifyWayResponse.ok || responseData.status !== 'success') {
      throw new Error(responseData.error || 'Failed to send OTP from VerifyWay');
    }

    // 5. أرسل استجابة ناجحة إلى تطبيق Flutter تحتوي على الرمز الذي تم إنشاؤه
    // سيحتاجه التطبيق للتحقق منه لاحقًا
    res.status(200).json({ success: true, generatedOtp: otp });

  } catch (error) {
    console.error(error); // لطباعة الخطأ في سجلات Vercel
    res.status(500).json({ success: false, message: error.message });
  }
};
