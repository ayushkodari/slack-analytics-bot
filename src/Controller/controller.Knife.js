import { runReport } from "../Helper/GA4.js";
import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";
import { lastdays,lastMonthRanges,monthStart,lastWeekDate } from "../Helper/Date.js";


export function formatTable(rows, columns, prettyCurrency = false, currency = "USD") {
  const data = rows.map(r => ({
    Country: r.Country ?? "(not set)",
    Total_Revenue: prettyCurrency
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(r.Total_Revenue || 0))
      : String(r.Total_Revenue ?? "0")
  }));

  const widths = {};
  for (const c of columns) {
    widths[c] = Math.max(c.length, ...data.map(row => String(row[c]).length));
  }
  const pad = (v, w, right = false) => (right ? String(v).padStart(w, " ") : String(v).padEnd(w, " "));

  const header  = columns.map((c,i) => pad(c, widths[c], i === 1)).join("  ");
  const divider = columns.map(c => "-".repeat(widths[c])).join("  ");
  const lines   = data.map(r => columns.map((c,i) => pad(r[c], widths[c], i === 1)).join("  "));

  return ["```", header, divider, ...lines, "```"].join("\n");
}

export const RevenueVsCountry = async (req,res)=>{
    try{
       const request = req.body.text;
       if(request[0] === "+"){
        const command = request.split("+")[1];
        switch(command.split(" ")[0]){
         case "week": {
         const startDate = lastdays(6);
         const [response] = await runReport(startDate, "today", "country", "totalRevenue");

         const rows = response.rows?.map(r => ({
         Country: r.dimensionValues?.[0]?.value || "(not set)",
         Total_Revenue: r.metricValues?.[0]?.value || "0",
         })) || [];

         // Top 10 by revenue
         rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
         const top10 = rows.slice(0, 10);

         const title = "Revenue vs Country · Last 7 Days (Top 10)";
         const table = formatTable(top10, ["Country", "Total_Revenue"], /*prettyCurrency*/ true, /*currency*/ "USD");

         res.type("text/plain");
         return res.send(`${title}\n${table}`);
         break;
         }
         case "month": {
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
         break;
         }
         case "day": {
            const startDate = command.split(" ")[1];
            const endDate = lastdays(0,startDate);

            const [response] = await runReport(endDate, startDate, "country", "totalRevenue");
            const rows = response.rows?.map(r => ({
            Country: r.dimensionValues?.[0]?.value || "(not set)",
            Total_Revenue: r.metricValues?.[0]?.value || "0",
            })) || [];

            rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
            const top10 = rows.slice(0, 10);

            const title = `Revenue vs Country · ${startDate}  Day (Top 10)`;
            const table = formatTable(top10, ["Country", "Total_Revenue"], /*prettyCurrency*/ true, /*currency*/ "USD");

            res.type("text/plain");
            return res.send(`${title}\n${table}`);
            break;
         }
         case "date": {
            const startDate = command.split(" ")[1];
            const endDate = command.split(" ")[2];

            const [response] = await runReport(startDate, endDate, "country", "totalRevenue");
            const rows = response.rows?.map(r => ({
            Country: r.dimensionValues?.[0]?.value || "(not set)",
            Total_Revenue: r.metricValues?.[0]?.value || "0",
            })) || [];

            rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
            const top10 = rows.slice(0, 10);

            const title = `Revenue vs Country · ${startDate} to ${endDate}  Day (Top 10)`;
            const table = formatTable(top10, ["Country", "Total_Revenue"], /*prettyCurrency*/ true, /*currency*/ "USD");

            res.type("text/plain");
            return res.send(`${title}\n${table}`);
            break;

         }
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
          '• `+week` → Last 7 days\n' +
          '• `+month` → Last 30 days\n' +
          '• `+day <YYYY-MM-DD>` → *Specific date only*. Example: `+day 2025-03-10`\n' +
          '• `+date <YYYY-MM-DD> <YYYY-MM-DD>` → From *startDate* to *endDate* . Example: `+date 2025-01-01 2025-11-01`'
          }
          },
          {
          type: 'context',
          elements: [
          {
          type: 'mrkdwn',
          text: 'Tip: If you cannot understand this please contact Ayush'
          }
          ]
          }
          ]
          });
       }
    }catch(err){
      return res.send(`Internal Server Error: ${err}`);
    }
}

export const SummaryMonthly = async (req,res)=>{
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
}

export const SummaryWeekly = async (req, res) => {
  try {
    const { startDate, endDate } = lastWeekDate(); // Get last week's date range

    // Fetch the last week's data
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

    // 🔍 Helper: Extract event data
    function extractEventData(response, eventName) {
      const row = response.rows?.find(r => r.dimensionValues?.[0]?.value === eventName);
      if (!row) return { activeUsers: 0, newUsers: 0, eventCount: 0 };

      const activeUsers = parseFloat(row.metricValues?.[3]?.value || 0);
      const newUsers = parseFloat(row.metricValues?.[4]?.value || 0);
      const eventCount = parseFloat(row.metricValues?.[5]?.value || 0);
      return { activeUsers, newUsers, eventCount };
    }

    // Extract `first_open` and `app_remove` for last week
    const firstOpenLast = extractEventData(response, "first_open");
    const appRemoveLast = extractEventData(response, "app_remove");

    // Revenue Metrics for last week
    const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
    const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
    const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);

    // Send the response with summary of last week
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
};

export const Summary = async(req,res)=>{
   try {
    res.json({
      response_type: "ephemeral", 
      text: "🗡️ Knife Summary Options",
      attachments: [
        {
          text: "Choose what summary you want:",
          fallback: "You are unable to choose an option",
          callback_id: "knife_summary_monthly",
          actions: [
            {
              name: "summary-month",
              text: "Monthly Summary",
              type: "button",
              value: "knife_summary_monthly",
            },
            {
              name: "summary-week",
              text: "Weekly Summary",
              type: "button",
              value: "knife_weekly_summary",
            },
            {
              name: "revenueVsCountry",
              text: "Last 7 days Revenue",
              type: "button",
              value: "knife_revenue_7",
            },
            {
              name: "revenueVsCountry",
              text: "Last 30 days Revenue",
              type: "button",
              value: "knife_revenue_30",
            },
            {
              name: "revenueVsCountry",
              text: "Last 24 hrs Revenue",
              type: "button",
              value: "knife_revenue_24hr",
            }
          ],
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(200).send("An error occurred");
  }
}


export const DetailedSummary = async(req,res)=>{
   try {
    res.json({
      response_type: "ephemeral", 
      text: "🗡️ Knife Detailed Summary Options",
      attachments: [
        {
          text: "Choose what Detailed Summary you want:",
          fallback: "You are unable to choose an option",
          callback_id: "knife_detailed_summary",
          actions: [
            {
              name: "activeUserVsCountry",
              text: "Active Users of 30 days",
              type: "button",
              value: "knife_active_30",
            }
          ],
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(200).send("An error occurred");
  }
}
