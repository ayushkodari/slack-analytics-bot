import express from "express";
import { configDotenv } from "dotenv";

configDotenv({path:`./.env.${process.env.NODE_ENV || 'development'}` });

const PORT = process.env.PORT;

const app = express();

app.get('/',(req,res)=>{
    res.send("Slack Analytics Bot");
})

app.listen(PORT, ()=>{
    console.log(`[SERVER]: server listening at port ${PORT}`);
})