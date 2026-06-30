const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const app = express();

app.get("/", (req,res)=>{
    res.send("WhatsApp Gemini AI Bot Running");
});


app.listen(process.env.PORT || 3000);



const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);



async function AIReply(text){

    const model = genAI.getGenerativeModel({
        model:"gemini-1.5-flash"
    });


    const result = await model.generateContent(
        `
        You are a helpful WhatsApp AI assistant.
        Reply in the same language as user.

        User:
        ${text}
        `
    );


    return result.response.text();

}



async function start(){


const {
    state,
    saveCreds
}
=
await useMultiFileAuthState(
"/opt/render/project/src/session"
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





if(!state.creds.registered){


let phone =
"917017659124";
// अपना नंबर डालो


setTimeout(async()=>{


let code =
await sock.requestPairingCode(phone);


console.log(
"PAIR CODE:",
code
);


},5000);


}






sock.ev.on(
"connection.update",
(update)=>{


const {
connection,
lastDisconnect
}
=update;



if(connection==="open"){

console.log(
"WHATSAPP CONNECTED"
);

}



if(connection==="close"){


let reason =
lastDisconnect?.error?.output?.statusCode;


if(reason !== DisconnectReason.loggedOut){

console.log(
"Restarting..."
);

start();

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



let sender =
msg.key.remoteJid;



console.log(
"Message:",
text
);




try{


let reply =
await AIReply(text);



await sock.sendMessage(
sender,
{
text:reply
}
);



}
catch(e){


console.log(e);


await sock.sendMessage(
sender,
{
text:"AI error, try again"
}
);


}



});


}



start();
