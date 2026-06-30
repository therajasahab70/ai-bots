const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/generative-ai');
const pino = require('pino');

// ================== CONFIGURATION ==================
const GEMINI_API_KEY = 'AQ.Ab8RN6JokgCn4pvENWzOdWDb0fL72YKVklU3WnAhIp8MAgV3rw'; // Apni Gemini API Key yahan dalein
const MY_PHONE_NUMBER = '917017659124'; // Apna WhatsApp number dalein (With 91)
// ===================================================

// Gemini AI Setup
const ai = new GoogleGenAI(GEMINI_API_KEY);
const model = ai.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: "Aap ek WhatsApp AI assistant hain. User abhi busy hai, isliye aap uski taraf se doston aur clients ko chat par short, polite aur helpful jawab de rahe hain. Hamesha Hinglish (Hindi + English mix) me jawab dein."
});

async function startBot() {
    // Session save karne ke liye settings
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false // Hum pairing code use karenge
    });

    // Credential update hone par save karne ke liye
    sock.ev.on('creds.update', saveCreds);

    // Connection Status Manage karne ke liye
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection close ho gaya. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('WhatsApp AI Bot successfully connect ho gaya hai!');
        }

        // Agar pairing code ki zaroorat hai
        if (!sock.authState.creds.registered) {
            try {
                setTimeout(async () => {
                    let code = await sock.requestPairingCode(MY_PHONE_NUMBER);
                    console.log('\n======================================');
                    console.log(`AAPKA WHATSAPP PAIRING CODE HAI: ${code}`);
                    console.log('======================================\n');
                    console.log('WhatsApp -> Linked Devices -> Link with phone number me jaakar ye code dalein.');
                }, 3000);
            } catch (err) {
                console.error('Pairing code lene me dikkat aayi:', err);
            }
        }
    });

    // Automatic AI Reply Logic
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        
        // Groups ko ignore karne ke liye
        if (from.endsWith('@g.us')) return;

        // Message text nikalna
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!textMessage) return;

        try {
            console.log(`Message aaya: ${textMessage}`);

            // Gemini AI se reply generate karwana
            const result = await model.generateContent(textMessage);
            const aiResponse = result.response.text();

            // Reply bhejna
            await sock.sendMessage(from, { text: aiResponse }, { quoted: msg });
        } catch (error) {
            console.error('AI reply dene me error:', error);
        }
    });
}

startBot();
