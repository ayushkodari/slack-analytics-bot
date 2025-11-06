import { runReport } from "../Helper/GA4.js";
import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";
import { lastdays,lastMonthRanges,monthStart } from "../Helper/Date.js";


function formatTable(rows, columns, prettyCurrency = false, currency = "USD") {
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
         dateRanges: [{ startDate, endDate:"today" }],
         metrics: [ 
            { name: "totalRevenue" },
            { name: "totalAdRevenue" },
            { name: "purchaseRevenue" }
         ],
      });

      const [responseLast] = await analyticsDataClient.runReport({
         property: `properties/${propertyId}`,
         dateRanges: [{ startDate:startLast, endDate:endLast }],
         metrics: [
             { name: "totalRevenue" },
             { name: "totalAdRevenue" },
             { name: "purchaseRevenue" }
         ],
      });

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
         `*📆 This Month*\n` +
         `• Total Revenue: *$${totalRevenue.toFixed(2)}*\n` +
         `• Ad Revenue: *$${adRevenue.toFixed(2)}*\n` +
         `• Purchase Revenue: *$${purchaseRevenue.toFixed(2)}*\n\n` +
         `*🗓️ Last Month*\n` +
         `• Total Revenue: *$${totalRevenueLast.toFixed(2)}*\n` +
         `• Ad Revenue: *$${adRevenueLast.toFixed(2)}*\n` +
         `• Purchase Revenue: *$${purchaseRevenueLast.toFixed(2)}*\n\n` +
         `📈 *Change in Total Revenue:* ${percentChange}%`);

   }catch(err){
      console.log(err);
      return res.send(`Internal Server Error: ${err}`);
   }
}