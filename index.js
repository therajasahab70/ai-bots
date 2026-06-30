const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const OpenAI = require("openai");

const app = express();

app.get("/", (req,res)=>{
    res.send("AI WhatsApp Bot Running");
});

app.listen(process.env.PORT || 3000);


const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


async function askAI(text){

    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages:[
            {
                role:"system",
                content:"You are a helpful WhatsApp assistant. Reply in the same language as the user."
            },
            {
                role:"user",
                content:text
            }
        ]
    });

    return response.choices[0].message.content;
}



async function startBot(){

const {state,saveCreds}=await useMultiFileAuthState("./session");


const sock=makeWASocket({
    auth:state,
    logger:pino({level:"silent"})
});


if(!sock.authState.creds.registered){

let phone="917017659124";

let code=await sock.requestPairingCode(phone);

console.log("PAIR CODE:",code);

}


sock.ev.on("creds.update",saveCreds);



sock.ev.on("messages.upsert",async({messages})=>{

const msg=messages[0];

if(!msg.message) return;
if(msg.key.fromMe) return;


let text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text;


let sender=msg.key.remoteJid;


let reply=await askAI(text);


await sock.sendMessage(sender,{
text:reply
});


});


}

startBot();
