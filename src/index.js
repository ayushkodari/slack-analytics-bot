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

const slack_web =slack_init(token);

app.get('/message',(req,res)=>{
    const {message} = req.query;
    sendSlackMessage(slack_web,channel,message);
})

app.post("/show-boobs",(req, res) => {
  console.log("Slash command received:", req.body);
   res.addTrailers.pipe(fs.createReadStream("/image.jpeg"));
  // res.send("👀 Command received successfully!");
});

app.listen(PORT, ()=>{
    console.log(`[SERVER]: server listening at port ${PORT}`);
})