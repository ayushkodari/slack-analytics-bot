import express from "express";
import { configDotenv } from "dotenv";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { slack_init,sendSlackMessage } from "./Helper/slack.js";
import bodyParser from "body-parser";

configDotenv({path:`./.env.${process.env.NODE_ENV || 'development'}` });

const PORT = process.env.PORT;
const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;


export const GA4 = {
  "type": "service_account",
  "project_id": process.env.GA4_PROJECT_ID,
  "private_key_id": process.env.GA4_PRIVATE_KEY_ID,
  "private_key": process.env.GA4_PRIVATE_KEY,
  "client_email": process.env.GA4_CLIENT_EMAIL,
  "client_id": process.env.GA4_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.GA4_CLIENT_X509_CERT_URL,
  "universe_domain": "googleapis.com"
}


const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: GA4, 
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); 

const slack_web =slack_init(token);

const runReport = async ()=>{
    const [response] = await analyticsDataClient.runReport({
        property:`properties/${process.env.GA4_PROPERTY_ID}`,
        dateRanges: [
      {
        startDate: '2025-08-30',
        endDate: 'today',
      },
    ],
    dimensions: [
      {
        name: 'country',
      },
    ],
    metrics: [
      {
        name: 'activeUsers'
      },
    ],
    });

  const formattedRows = response.rows.map(row => {
  const country = row.dimensionValues?.[0]?.value || "Unknown";
  const activeUsers = row.metricValues?.[0]?.value || "0";
  return { country, activeUsers };
});

console.table(formattedRows);
}

app.get('/message',(req,res)=>{
    const {message} = req.query;
    sendSlackMessage(slack_web,channel,message);
})

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
  runReport()
  res.send("Hello World")
})

app.listen(PORT, ()=>{
    console.log(`[SERVER]: server listening at port ${PORT}`);
})