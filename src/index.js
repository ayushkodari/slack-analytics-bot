import express from "express";
import { configDotenv } from "dotenv";
import { slack_init,sendSlackMessage } from "./Helper/slack.js";
import bodyParser from "body-parser";
import fs from "node:fs";

configDotenv({path:`./.env.${process.env.NODE_ENV || 'development'}` });

const PORT = process.env.PORT;
const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); 

const slack_web =slack_init(token);

app.get('/message',(req,res)=>{
    const {message} = req.query;
    sendSlackMessage(slack_web,channel,message);
})

app.post("/show-boobs",(req, res) => {
  //   res.setHeader("Content-Type", "image/jpeg");
  // res.setHeader("Content-Disposition", "inline; filename=\"image.jpeg\"");
  console.log("Slash command received:", req.body);
  
  // const readableStream = fs.createReadStream("./image.jpeg");
  // readableStream.on("data",(chunk)=>{
  //   console.log(chunk);
  //   res.send(chunk);
  // });

  // res.send(`https://stanton-unslain-ross.ngrok-free.dev/image.jpeg`);
  res.json({
    response_type: "in_channel", // makes the image visible to everyone
    text: "Here’s your image 👀",
    attachments: [
      {
        image_url: "https://stanton-unslain-ross.ngrok-free.dev/image.jpeg", // must be a public URL
        alt_text: "Boobs Image"
      }
    ]
  });
});

app.get('/',(req,res)=>{
  res.send("Hello World")
})

app.listen(PORT, ()=>{
    console.log(`[SERVER]: server listening at port ${PORT}`);
})