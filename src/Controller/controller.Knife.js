import { runReport } from "../Helper/GA4.js";
import { lastdays } from "../Helper/Date.js";


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
            const startDate = command.split(" ")[2];
            const endDate = command.split(" ")[1];

            const [response] = await runReport(endDate, startDate, "country", "totalRevenue");
            const rows = response.rows?.map(r => ({
            Country: r.dimensionValues?.[0]?.value || "(not set)",
            Total_Revenue: r.metricValues?.[0]?.value || "0",
            })) || [];

            rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
            const top10 = rows.slice(0, 10);

            const title = `Revenue vs Country · ${endDate} to ${startDate}  Day (Top 10)`;
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
          '• `+date <YYYY-MM-DD> <YYYY-MM-DD>` → From that date *up to today*. Example: `+date 2025-01-01 2025-11-01`'
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