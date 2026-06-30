
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode-terminal");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.get("/", (req,res)=>{
  res.send("WhatsApp Gemini QR Bot Running");
});

app.listen(process.env.PORT || 3000);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function AIReply(text){
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const result = await model.generateContent(
    "Reply like a helpful WhatsApp assistant in same language:\n" + text
  );

  return result.response.text();
}

async function start(){

  const { state, saveCreds } =
    await useMultiFileAuthState("./session2");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level:"silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update)=>{

    const { connection, qr, lastDisconnect } = update;

    if(qr){
      console.log("SCAN THIS QR:");
      QRCode.generate(qr,{small:true});
    }

    if(connection === "open"){
      console.log("WHATSAPP CONNECTED");
    }

    if(connection === "close"){
      const reason =
      lastDisconnect?.error?.output?.statusCode;

      if(reason !== DisconnectReason.loggedOut){
        start();
      }
    }
  });


  sock.ev.on("messages.upsert", async({messages})=>{

    const msg = messages[0];

    if(!msg.message) return;
    if(msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if(!text) return;

    const reply = await AIReply(text);

    await sock.sendMessage(msg.key.remoteJid,{
      text: reply
    });

  });

}

start();
