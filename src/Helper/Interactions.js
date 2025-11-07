import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";
import { lastMonthRanges,monthStart,lastWeekDate,lastdays } from "./Date.js";
import { formatTable } from "../Controller/controller.Knife.js";
import { runReport } from "./GA4.js";

export const Interactions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const action = payload.actions[0];
    const responseUrl = payload.response_url;

    if (action.value === "knife_summary_monthly") {
          try{
               const startDate = monthStart();
               const {startLast,endLast} =lastMonthRanges();
            
               const [response] = await analyticsDataClient.runReport({
           property: `properties/${propertyId}`,
           dateRanges: [{ startDate, endDate: "today" }],
           dimensions: [{ name: "eventName" }],
           metrics: [
             { name: "totalRevenue" },
             { name: "totalAdRevenue" },
             { name: "purchaseRevenue" },
             { name: "activeUsers" },
             { name: "newUsers" },
             { name: "eventCount" },
           ],
         });
         
         const [responseLast] = await analyticsDataClient.runReport({
           property: `properties/${propertyId}`,
           dateRanges: [{ startDate: startLast, endDate: endLast }],
           dimensions: [{ name: "eventName" }],
           metrics: [
             { name: "totalRevenue" },
             { name: "totalAdRevenue" },
             { name: "purchaseRevenue" },
             { name: "activeUsers" },
             { name: "newUsers" },
             { name: "eventCount" },
           ],
         });
         
         // 🔍 Helper: Extract event data
         function extractEventData(response, eventName) {
           const row = response.rows?.find(r => r.dimensionValues?.[0]?.value === eventName);
           if (!row) return { activeUsers: 0, newUsers: 0, eventCount: 0 };
         
           const activeUsers = parseFloat(row.metricValues?.[3]?.value || 0);
           const newUsers = parseFloat(row.metricValues?.[4]?.value || 0);
           const eventCount = parseFloat(row.metricValues?.[5]?.value || 0);
           return { activeUsers, newUsers, eventCount };
         }
         
         // 🔹 This month data
         const firstOpenThis = extractEventData(response, "first_open");
         const appRemoveThis = extractEventData(response, "app_remove");
         
       
         const firstOpenLast = extractEventData(responseLast, "first_open");
         const appRemoveLast = extractEventData(responseLast, "app_remove");
         
  
         const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
         const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
         const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);
         
         const totalRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[0]?.value || 0);
         const adRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[1]?.value || 0);
         const purchaseRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[2]?.value || 0);
         
         const percentChange = totalRevenueLast
           ? (((totalRevenue - totalRevenueLast) / totalRevenueLast) * 100).toFixed(2)
           : "N/A";
         
        
         return res.send(
           `💰 *Revenue Summary*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*📆 This Month So Far*\n` +
           `• Total Revenue: *$${totalRevenue.toFixed(2)}*\n` +
           `• Ad Revenue: *$${adRevenue.toFixed(2)}*\n` +
           `• Purchase Revenue: *$${purchaseRevenue.toFixed(2)}*\n\n` +
         
           `*🗓️ Last Month*\n` +
           `• Total Revenue: *$${totalRevenueLast.toFixed(2)}*\n` +
           `• Ad Revenue: *$${adRevenueLast.toFixed(2)}*\n` +
           `• Purchase Revenue: *$${purchaseRevenueLast.toFixed(2)}*\n\n` +
         
           `📈 *Change in Total Revenue:* ${percentChange}%\n\n` +
           `👥 *User Metrics*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*📆 This Month So Far*\n` +
           `• *first_open* → ${firstOpenThis.activeUsers} users\n` +
           `   - Event Count: ${firstOpenThis.eventCount}\n` +
           `• *app_remove* → ${appRemoveThis.activeUsers} users\n` +
           `   - Event Count: ${appRemoveThis.eventCount}\n\n` +
         
           `*🗓️ Last Month*\n` +
           `• *first_open* → ${firstOpenLast.activeUsers} users\n` +
           `   - Event Count: ${firstOpenLast.eventCount}\n` +
           `• *app_remove* → ${appRemoveLast.activeUsers} users\n` +
           `   - Event Count: ${appRemoveLast.eventCount}`
         );
         
            }catch(err){
               console.log(err);
               return res.send(`Internal Server Error: ${err}`);
            }

    } else if (action.value === "knife_weekly_summary") {
      try {
         const { startDate, endDate } = lastWeekDate();
    
         const [response] = await analyticsDataClient.runReport({
           property: `properties/${propertyId}`,
           dateRanges: [{ startDate, endDate }],
           dimensions: [{ name: "eventName" }],
           metrics: [
             { name: "totalRevenue" },
             { name: "totalAdRevenue" },
             { name: "purchaseRevenue" },
             { name: "activeUsers" },
             { name: "newUsers" },
             { name: "eventCount" },
           ],
         });
     
         function extractEventData(response, eventName) {
           const row = response.rows?.find(r => r.dimensionValues?.[0]?.value === eventName);
           if (!row) return { activeUsers: 0, newUsers: 0, eventCount: 0 };
     
           const activeUsers = parseFloat(row.metricValues?.[3]?.value || 0);
           const newUsers = parseFloat(row.metricValues?.[4]?.value || 0);
           const eventCount = parseFloat(row.metricValues?.[5]?.value || 0);
           return { activeUsers, newUsers, eventCount };
         }
     

         const firstOpenLast = extractEventData(response, "first_open");
         const appRemoveLast = extractEventData(response, "app_remove");
     

         const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
         const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
         const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);
     
         return res.send(
           `💰 *Revenue Summary for Last Week*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*📆 Last Week*\n` +
           `• Total Revenue: *$${totalRevenue.toFixed(2)}*\n` +
           `• Ad Revenue: *$${adRevenue.toFixed(2)}*\n` +
           `• Purchase Revenue: *$${purchaseRevenue.toFixed(2)}*\n\n` +
     
           `👥 *User Metrics for Last Week*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `• *first_open* → ${firstOpenLast.activeUsers} users\n` +
           `   - Event Count: ${firstOpenLast.eventCount}\n` +
           `• *app_remove* → ${appRemoveLast.activeUsers} users\n` +
           `   - Event Count: ${appRemoveLast.eventCount}`
         );
       } catch (err) {
         console.log(err);
         return res.send(`Internal Server Error: ${err}`);
       }
    } else if (action.value === "knife_revenue_7") {
       try{
       
        const startDate = lastdays(6);
        const [response] = await runReport(startDate, "today", "country", "totalRevenue");
      
        const rows = response.rows?.map(r => ({
          Country: r.dimensionValues?.[0]?.value || "(not set)",
          Total_Revenue: r.metricValues?.[0]?.value || "0",
          })) || [];
      
               
          rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
          const top10 = rows.slice(0, 10);
      
          const title = "Revenue vs Country · Last 7 Days (Top 10)";
          const table = formatTable(top10, ["Country", "Total_Revenue"], /*prettyCurrency*/ true, /*currency*/ "USD");
      
          res.type("text/plain");
          return res.send(`${title}\n${table}`); 
       }catch(err){
          res.status(200).send("❌ Interaction Error:", err.message);
       }
    } else if (action.value === "knife_revenue_30") {
       try{
        const startDate = lastdays(29);
           const [response] = await runReport(startDate, "today", "country", "totalRevenue");

           const rows = response.rows?.map(r => ({
           Country: r.dimensionValues?.[0]?.value || "(not set)",
           Total_Revenue: r.metricValues?.[0]?.value || "0",
         })) || [];

         rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
         const top10 = rows.slice(0, 10);

         const title = "Revenue vs Country · Last 30 Days (Top 10)";
         const table = formatTable(top10, ["Country", "Total_Revenue"], /*prettyCurrency*/ true, /*currency*/ "USD");

         res.type("text/plain");
         return res.send(`${title}\n${table}`);
       }catch(err){
          res.status(200).send("❌ Interaction Error:", err.message);
       }
    }else if (action.value === "knife_revenue_24hr") {
       try{
        const startDate = lastdays(1);
           const [response] = await runReport(startDate, "today", "country", "totalRevenue");

           const rows = response.rows?.map(r => ({
           Country: r.dimensionValues?.[0]?.value || "(not set)",
           Total_Revenue: r.metricValues?.[0]?.value || "0",
         })) || [];

         rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
         const top10 = rows.slice(0, 10);

         const title = "Revenue vs Country · Last 24hrs (Top 10)";
         const table = formatTable(top10, ["Country", "Total_Revenue"], /*prettyCurrency*/ true, /*currency*/ "USD");

         res.type("text/plain");
         return res.send(`${title}\n${table}`);
       }catch(err){
          res.status(200).send("❌ Interaction Error:", err.message);
       }
    }
    else {
    res.status(200).send("❌ Interaction Error: Wrong Selection");
    }
  } catch (err) {
    console.error("❌ Interaction Error:", err.message);
    res.status(200).send("❌ Interaction Error:", err.message);
  }
};


