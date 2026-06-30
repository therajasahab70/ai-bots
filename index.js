const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.get("/", (req, res) => {
    res.send("Gemini WhatsApp Bot Running");
});

app.listen(process.env.PORT || 3000);


// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(message) {

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(
        "Reply like a helpful WhatsApp assistant. Answer in the same language.\n\nUser: " 
        + message
    );

    return result.response.text();
}



async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./session");


    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" })
    });



    if (!sock.authState.creds.registered) {

        let phone = "91XXXXXXXXXX";
        // 👆 yaha apna WhatsApp number country code ke sath dale


        let code = await sock.requestPairingCode(phone);

        console.log("PAIR CODE:", code);
    }



    sock.ev.on("creds.update", saveCreds);



    sock.ev.on("messages.upsert", async ({ messages }) => {

        const msg = messages[0];

        if (!msg.message) return;
        if (msg.key.fromMe) return;


        let text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text;


        if (!text) return;


        let sender = msg.key.remoteJid;


        try {

            let reply = await askGemini(text);


            await sock.sendMessage(sender, {
                text: reply
            });


        } catch(e) {

            await sock.sendMessage(sender, {
                text:"AI error aa gaya, thodi der baad try karein."
            });

        }

    });


}


startBot();
