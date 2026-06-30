const { Client, LocalAuth } = require('whatsapp-web.js');
const { GoogleGenAI } = require('@google/generative-ai');

// Render ke environment setting se fetch karna
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const MY_PHONE_NUMBER = process.env.PHONE_NUMBER; 

// Bilkul crash-free initialize syntax
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
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
        if (chat.isGroup) return; 

        if (msg.type === 'chat') {
            const result = await model.generateContent(msg.body);
            const aiResponse = result.response.text();
            await msg.reply(aiResponse);
        }
    } catch (error) {
        console.error('AI Reply Error:', error);
    }
});

client.initialize();
