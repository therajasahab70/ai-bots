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

app.listen(process.env.PORT || 3000, ()=>{
  console.log("SERVER STARTED");
});



const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);



async function AIReply(text){

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

  const result = await model.generateContent(
    "Reply like WhatsApp AI assistant. Same language as user:\n" + text
  );

  return result.response.text();
}



async function startBot(){

console.log("BOT STARTING...");


const {state,saveCreds} =
await useMultiFileAuthState(
"./session"
);



const sock = makeWASocket({

auth:state,

logger:pino({
 level:"silent"
}),

browser:[
 "Chrome",
 "Linux",
 "1.0"
]

});



sock.ev.on(
"creds.update",
saveCreds
);



sock.ev.on(
"connection.update",
(update)=>{


const {
 connection,
 qr,
 lastDisconnect
}=update;



console.log(
"CONNECTION:",
connection
);



if(qr){

console.log("SCAN QR CODE:");

QRCode.generate(
qr,
{
 small:true
}
);

}



if(connection==="open"){

console.log(
"WHATSAPP CONNECTED ✅"
);

}



if(connection==="close"){

let reason =
lastDisconnect?.error?.output?.statusCode;


console.log(
"CLOSED:",
reason
);



if(reason !== DisconnectReason.loggedOut){

setTimeout(()=>{
startBot();
},5000);

}

}


});






sock.ev.on(
"messages.upsert",
async({messages})=>{


const msg = messages[0];


if(!msg.message)
return;


if(msg.key.fromMe)
return;



let text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text;



if(!text)
return;



console.log(
"MSG:",
text
);



try{


let reply =
await AIReply(text);



await sock.sendMessage(
msg.key.remoteJid,
{
 text:reply
}
);



console.log(
"REPLY DONE"
);



}catch(e){

console.log(
"AI ERROR",
e
);

}


});


}


startBot();
