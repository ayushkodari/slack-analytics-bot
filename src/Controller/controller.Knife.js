import { sendSlackMessageChannel } from "../Helper/slack.js";
import { runReport } from "../Helper/GA4.js";
import { Last7days } from "../Helper/Date.js";


export const RevenueVsCountry = async (req,res)=>{
    try{
       const request = req.body.text;
       if(request[0] === "-"){
        const command = request.split("-")[1];
        switch(command.split(" ")[0]){
         case "week": {
            const startDate = Last7days();
            const [response] =await runReport(startDate,"today","country","totalRevenue"); // startDate,endDate,dimensionsValue,metricsValue
                const rows = response.rows?.map(r => ({
                Country: r.dimensionValues?.[0]?.value || "(not set)",
                Total_Revenue: r.metricValues?.[0]?.value || "0",
           })) || [];

           console.table(rows);
           return res.send(`RevenueVSCountry Data for last week`);
        }
         case "m": {res.send(`RevenueVSCountry Data month wise`);}
         case "date": {res.send(`RevenueVSCountry Data specific date only`);}
         case "d": {res.send(`RevenueVSCountry Data from that date up to today.`);}
        }
       }else{
          return res.json({
          response_type: 'ephemeral',
          text: 'How to use date filters',
          blocks: [
          {
          type: 'header',
          text: { type: 'plain_text', text: 'How to use date filters', emoji: true }
          },
          {
          type: 'section',
          text: {
          type: 'mrkdwn',
          text:
          '*Parameters*\n' +
          '• `-week` → Last 7 days\n' +
          '• `-m <1–12>` → Specific month (current year). Example: `-m 8` (August)\n' +
          '• `-date <YYYY-MM-DD>` → *Specific date only*. Example: `-d 2025-03-10`\n' +
          '• `-d <YYYY-MM-DD>` → From that date *up to today*. Example: `2025-03-10`'
          }
          },
          {
          type: 'context',
          elements: [
          {
          type: 'mrkdwn',
          text: 'Tip: If you cannot understand this contact Ayush'
          }
          ]
          }
          ]
          });
       }
    }catch(err){
      console.log(err);
    }
     console.log("Slash command received:", req.body.text);

    // sendSlackMessageChannel("RevenueVSCountry Data");
    // const [response] =runReport();
    // console.log(response);
    console.log("RevenueVSCountry Data");
  
}