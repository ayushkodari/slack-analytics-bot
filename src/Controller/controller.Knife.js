import { sendSlackMessageChannel } from "../Helper/slack.js";
import { runReport } from "../Helper/GA4.js";


export const RevenueVsCountry = async (req,res)=>{
    // sendSlackMessageChannel("RevenueVSCountry Data");
    const [response] =runReport();
    console.log(response);
    console.log("RevenueVSCountry Data");
    return res.send("RevenueVSCountry Data");
}