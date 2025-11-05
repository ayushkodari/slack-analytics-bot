import express from "express";
import { port } from "./Config/env.js";
import { router as knife } from "./Router/router.knife.js";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); 
app.use('/knife',knife);

app.post("/show-boobs",(req, res) => {
  console.log("Slash command received:", req.body);
  res.json({
    response_type: "in_channel",
    text: "Here’s your image 👀",
    attachments: [
      {
        image_url: "https://stanton-unslain-ross.ngrok-free.dev/image.jpeg",
        alt_text: "Boobs Image"
      }
    ]
  });
});

app.post("/upload-csv",(req,res)=>{
   console.log("Slash command received:", req.body);
   res.send(`Text File :${req.body.text}`);
})

app.get('/',(req,res)=>{
  res.send("Welcome to Slack Analytics Bot");
});

app.listen(port, ()=>{
    console.log(`[SERVER]: server listening at port ${port}`);
});