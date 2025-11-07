import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";
import { lastMonthRanges,monthStart } from "./Date.js";

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
         
         // 🔹 Last month data
         const firstOpenLast = extractEventData(responseLast, "first_open");
         const appRemoveLast = extractEventData(responseLast, "app_remove");
         
         // 💰 Revenue summary (existing part)
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

    } else if (action.value === "weekly_summary") {
     
    } else {
      await axios.post(responseUrl, {
        response_type: "ephemeral",
        text: "Unknown option selected.",
      });
      return;
    }


  } catch (err) {
    console.error("❌ Interaction Error:", err.message);
    res.status(200).send(); // always 200 so Slack doesn’t retry
  }
};
