const { Client, LocalAuth } = require('whatsapp-web.js');
const { GoogleGenAI } = require('@google/generative-ai');

// ================== CONFIGURATION ==================
const MY_PHONE_NUMBER = '917017659124'; // Apna WhatsApp number (With 91)
const GEMINI_API_KEY = 'AQ.Ab8RN6JokgCn4pvENWzOdWDb0fL72YKVklU3WnAhIp8MAgV3rw'; // Apni Gemini API Key yahan paste karein
// ===================================================

// AI Setup: Is tarike se ab "not a constructor" ka error 100% nahi aayega
const ai = new GoogleGenAI(GEMINI_API_KEY);
const model = ai.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: "Aap ek WhatsApp AI assistant hain. User busy hai, isliye aap Hinglish me polite aur short reply de rahe hain."
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

// Yahan se aapko logs me 8-digit ka Pairing Code milega link karne ke liye
client.on('qr', async (qr) => {
    try {
        console.log('Pairing Code request kar rahe hain...');
        const pairingCode = await client.requestPairingCode(MY_PHONE_NUMBER);
        console.log('\n======================================');
        console.log(`AAPKA WHATSAPP PAIRING CODE HAI: ${pairingCode}`);
        console.log('======================================\n');
        console.log('Apne phone me WhatsApp -> Linked Devices -> Link with phone number me jaakar ye code dalein.');
    } catch (err) {
        console.error('Pairing code error aaya:', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp Bot successfully ready ho gaya hai!');
});

client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        if (chat.isGroup) return; // Groups ko ignore karein

        if (msg.type === 'chat') {
            console.log(`Message aaya: ${msg.body}`);
            const result = await model.generateContent(msg.body);
            const aiResponse = result.response.text();
            await msg.reply(aiResponse);
        }
    } catch (error) {
        console.error('AI Reply Error:', error);
    }
});

client.initialize();
