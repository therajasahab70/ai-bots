const {default: makeWASocket,useMultiFileAuthState}=require("@whiskeysockets/baileys");
const pino=require("pino");
const express=require("express");
const {GoogleGenerativeAI}=require("@google/generative-ai");

const app=express();
app.get("/",(q,r)=>r.send("Bot Running"));
app.listen(process.env.PORT||3000);

const ai=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function start(){
const {state,saveCreds}=await useMultiFileAuthState("./session");

const sock=makeWASocket({
auth:state,
logger:pino({level:"silent"})
});

sock.ev.on("creds.update",saveCreds);

sock.ev.on("connection.update",(u)=>{
if(u.qr) console.log("QR GENERATED");
if(u.connection==="open") console.log("CONNECTED");
});

sock.ev.on("messages.upsert",async({messages})=>{
const m=messages[0];
if(!m.message||m.key.fromMe)return;

const text=m.message.conversation||"";
if(!text)return;

const model=ai.getGenerativeModel({model:"gemini-1.5-flash"});
const r=await model.generateContent("Reply helpful:\n"+text);

await sock.sendMessage(m.key.remoteJid,{text:r.response.text()});
});
}
start();
