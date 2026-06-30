const { Client, LocalAuth } = require('whatsapp-web.js');
const { GoogleGenAI } = require('@google/generative-ai');

// ================== CONFIGURATION ==================
const MY_PHONE_NUMBER = '917017659124'; // Yahan apna WhatsApp number daalein (With 91)
const GEMINI_API_KEY = 'AQ.Ab8RN6JokgCn4pvENWzOdWDb0fL72YKVklU3WnAhIp8MAgV3rw'; // Yahan apni Gemini API Key paste karein
// ===================================================

// AI Setup (New official syntax ke sath - ab error nahi aayega)
const ai = new GoogleGenAI(GEMINI_API_KEY);
const model = ai.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: "Aap ek WhatsApp AI assistant hain. User abhi busy hai, isliye aap uski taraf se doston aur clients ko chat par short, polite aur helpful jawab de rahe hain. Hamesha Hinglish (Hindi + English mix) me jawab dein."
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

// Pairing Code Generation Logic
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
    console.log('WhatsApp AI Bot ready hai aur successfully kaam kar raha hai!');
});

// AI Automatic Reply Logic
client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        if (chat.isGroup) return; // Groups ko ignore karein

        if (msg.type === 'chat') {
            console.log(`Message aaya (${msg.from}): ${msg.body}`);

            // AI Response generation
            const result = await model.generateContent(msg.body);
            const aiResponse = result.response.text();

            // WhatsApp par reply bhejna
            await msg.reply(aiResponse);
        }
    } catch (error) {
        console.error('AI reply dene me error aaya:', error);
    }
});

client.initialize();
