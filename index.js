const { Client, LocalAuth } = require('whatsapp-web.js');
const { GoogleGenAI } = require('@google/generative-ai');

// ================== CONFIGURATION ==================
const MY_PHONE_NUMBER = '917017659124'; // 1. Apna WhatsApp number dalein
const GEMINI_API_KEY = 'AQ.Ab8RN6JokgCn4pvENWzOdWDb0fL72YKVklU3WnAhIp8MAgV3rw'; // 2. Apni Gemini API Key dalein
// ===================================================

// AI Setup: New version me GoogleGenAI function ko bina 'new' keyword ke initialize karte hain
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const model = ai.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: "Aap ek WhatsApp AI assistant hain. User abhi busy hai, isliye aap uski taraf se short aur polite jawab Hinglish me de rahe hain."
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

// YAHAN HAI PAIRING CODE KA OPTION!
client.on('qr', async (qr) => {
    try {
        console.log('Pairing Code request kar rahe hain...');
        // Ye line WhatsApp server se 8-digit ka code mangwayegi
        const pairingCode = await client.requestPairingCode(MY_PHONE_NUMBER);
        console.log('\n======================================');
        console.log(`AAPKA WHATSAPP PAIRING CODE HAI: ${pairingCode}`);
        console.log('======================================\n');
        console.log('Apne phone me WhatsApp -> Linked Devices -> Link with phone number me jaakar ye code dalein.');
    } catch (err) {
        console.error('Pairing code lene me error aaya:', err);
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
