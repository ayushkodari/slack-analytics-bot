import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";
import { lastMonthRanges, monthStart, lastWeekDate, lastdays } from "./Date.js";
import { formatTable } from "../Controller/controller.Knife.js";
import { runReport } from "./GA4.js";

/**
 * Helper function to extract event data from GA4 response
 */
const extractEventData = (response, eventName) => {
  const row = response.rows?.find(r => r.dimensionValues?.[0]?.value === eventName);
  if (!row) return { activeUsers: 0, newUsers: 0, eventCount: 0 };

  const activeUsers = parseFloat(row.metricValues?.[3]?.value || 0);
  const newUsers = parseFloat(row.metricValues?.[4]?.value || 0);
  const eventCount = parseFloat(row.metricValues?.[5]?.value || 0);
  return { activeUsers, newUsers, eventCount };
};

/**
 * Helper function to calculate percentage change
 */
const calculatePercentChange = (current, previous) => {
  if (!previous || previous === 0) return "N/A";
  return (((current - previous) / previous) * 100).toFixed(2);
};

/**
 * Helper function to format currency
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Helper function to add trend emoji
 */
const getTrendEmoji = (percentChange) => {
  if (percentChange === "N/A") return "➖";
  const change = parseFloat(percentChange);
  if (change > 0) return "📈";
  if (change < 0) return "📉";
  return "➖";
};

/**
 * Monthly Summary Handler
 */
const handleMonthlySummary = async (res) => {
  try {
    const startDate = monthStart();
    const { startLast, endLast } = lastMonthRanges();

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

    // Extract event data
    const firstOpenThis = extractEventData(response, "first_open");
    const appRemoveThis = extractEventData(response, "app_remove");
    const firstOpenLast = extractEventData(responseLast, "first_open");
    const appRemoveLast = extractEventData(responseLast, "app_remove");

    // Extract revenue data
    const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
    const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
    const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);

    const totalRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[0]?.value || 0);
    const adRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[1]?.value || 0);
    const purchaseRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[2]?.value || 0);

    // Calculate percentage changes
    const totalRevenueChange = calculatePercentChange(totalRevenue, totalRevenueLast);
    const adRevenueChange = calculatePercentChange(adRevenue, adRevenueLast);
    const purchaseRevenueChange = calculatePercentChange(purchaseRevenue, purchaseRevenueLast);
    const firstOpenChange = calculatePercentChange(firstOpenThis.activeUsers, firstOpenLast.activeUsers);
    const appRemoveChange = calculatePercentChange(appRemoveThis.activeUsers, appRemoveLast.activeUsers);

    return res.send(
      `🗡️ *KNIFE ANALYTICS - MONTHLY REPORT*\n` +
      `${" ".repeat(45)}\n\n` +
      `💰 *REVENUE SUMMARY*\n` +
      `${"─".repeat(45)}\n` +
      `*📆 This Month So Far*\n` +
      `• Total Revenue: *${formatCurrency(totalRevenue)}* ${getTrendEmoji(totalRevenueChange)} *${totalRevenueChange}%*\n` +
      `• Ad Revenue: *${formatCurrency(adRevenue)}* ${getTrendEmoji(adRevenueChange)} *${adRevenueChange}%*\n` +
      `• Purchase Revenue: *${formatCurrency(purchaseRevenue)}* ${getTrendEmoji(purchaseRevenueChange)} *${purchaseRevenueChange}%*\n\n` +
      `*🗓️ Last Month (Comparison)*\n` +
      `• Total Revenue: *${formatCurrency(totalRevenueLast)}*\n` +
      `• Ad Revenue: *${formatCurrency(adRevenueLast)}*\n` +
      `• Purchase Revenue: *${formatCurrency(purchaseRevenueLast)}*\n\n` +
      `${" ".repeat(45)}\n\n` +
      `👥 *USER METRICS*\n` +
      `${"─".repeat(45)}\n` +
      `*📆 This Month So Far*\n` +
      `• *first_open* → ${firstOpenThis.activeUsers.toLocaleString()} users ${getTrendEmoji(firstOpenChange)} *${firstOpenChange}%*\n` +
      `  └ Event Count: ${firstOpenThis.eventCount.toLocaleString()}\n` +
      `• *app_remove* → ${appRemoveThis.activeUsers.toLocaleString()} users ${getTrendEmoji(appRemoveChange)} *${appRemoveChange}%*\n` +
      `  └ Event Count: ${appRemoveThis.eventCount.toLocaleString()}\n\n` +
      `*🗓️ Last Month (Comparison)*\n` +
      `• *first_open* → ${firstOpenLast.activeUsers.toLocaleString()} users\n` +
      `  └ Event Count: ${firstOpenLast.eventCount.toLocaleString()}\n` +
      `• *app_remove* → ${appRemoveLast.activeUsers.toLocaleString()} users\n` +
      `  └ Event Count: ${appRemoveLast.eventCount.toLocaleString()}\n\n` +
      `${" ".repeat(45)}\n` 
    );
  } catch (err) {
    console.error("❌ Monthly Summary Error:", err);
    return res.send(`❌ *Error generating monthly summary*\n\`\`\`${err.message}\`\`\``);
  }
};

/**
 * Weekly Summary Handler
 */
const handleWeeklySummary = async (res) => {
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

    // Extract event data
    const firstOpenLast = extractEventData(response, "first_open");
    const appRemoveLast = extractEventData(response, "app_remove");

    // Extract revenue data
    const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
    const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
    const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);

    return res.send(
      `🗡️ *KNIFE ANALYTICS - WEEKLY REPORT*\n` +
      `${" ".repeat(45)}\n\n` +
      `💰 *REVENUE SUMMARY*\n` +
      `${"─".repeat(45)}\n` +
      `*📆 Last Week (${startDate} to ${endDate})*\n` +
      `• Total Revenue: *${formatCurrency(totalRevenue)}*\n` +
      `• Ad Revenue: *${formatCurrency(adRevenue)}*\n` +
      `• Purchase Revenue: *${formatCurrency(purchaseRevenue)}*\n\n` +
      `${" ".repeat(45)}\n\n` +
      `👥 *USER METRICS*\n` +
      `${"─".repeat(45)}\n` +
      `• *first_open* → ${firstOpenLast.activeUsers.toLocaleString()} users\n` +
      `  └ Event Count: ${firstOpenLast.eventCount.toLocaleString()}\n` +
      `• *app_remove* → ${appRemoveLast.activeUsers.toLocaleString()} users\n` +
      `  └ Event Count: ${appRemoveLast.eventCount.toLocaleString()}\n\n` +
      `${" ".repeat(45)}\n` 
    );
  } catch (err) {
    console.error("❌ Weekly Summary Error:", err);
    return res.send(`❌ *Error generating weekly summary*\n\`\`\`${err.message}\`\`\``);
  }
};

/**
 * Revenue by Country Handler
 */
const handleRevenueByCountry = async (res, days, label) => {
  try {
    const startDate = lastdays(days);
    const [response] = await runReport(startDate, "today", "country", "totalRevenue");

    const rows = response.rows?.map(r => ({
      Country: r.dimensionValues?.[0]?.value || "(not set)",
      Total_Revenue: r.metricValues?.[0]?.value || "0",
    })) || [];

    if (rows.length === 0) {
      return res.send(`ℹ️ *No revenue data available for ${label}*`);
    }

    rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
    const top10 = rows.slice(0, 10);

    // Calculate total revenue
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.Total_Revenue), 0);

    const title = `🗡️ *KNIFE ANALYTICS - REVENUE BY COUNTRY*\n${label} (Top 10)\n${" ".repeat(45)}`;
    const table = formatTable(top10, ["Country", "Total_Revenue"], true, "USD");
    const footer = `\n${"─".repeat(45)}\n*Total Revenue (All Countries):* ${formatCurrency(totalRevenue)}\n`;

    res.type("text/plain");
    return res.send(`${title}\n${table}${footer}`);
  } catch (err) {
    console.error(`❌ Revenue by Country Error (${label}):`, err);
    res.status(200).send(`❌ *Error generating revenue report for ${label}*\n\`\`\`${err.message}\`\`\``);
  }
};

/**
 * Main Interactions Handler
 */
export const Interactions = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    const action = payload.actions[0];
    const responseUrl = payload.response_url;

    switch (action.value) {
      case "knife_summary_monthly":
        return await handleMonthlySummary(res);

      case "knife_weekly_summary":
        return await handleWeeklySummary(res);

      case "knife_revenue_7":
        return await handleRevenueByCountry(res, 6, "Last 7 Days");

      case "knife_revenue_30":
        return await handleRevenueByCountry(res, 29, "Last 30 Days");

      case "knife_revenue_24hr":
        return await handleRevenueByCountry(res, 1, "Last 24 Hours");

      default:
        return res.status(200).send("❌ *Unknown Action*\nPlease select a valid option from the menu.");
    }
  } catch (err) {
    console.error("❌ Interaction Error:", err);
    return res.status(200).send(`❌ *Interaction Error*\n\`\`\`${err.message}\`\`\``);
  }
};


// import { analyticsDataClient } from "../Config/ga4.js";
// import { propertyId } from "../Config/env.js";
// import { lastMonthRanges, monthStart, lastWeekDate, lastdays } from "./Date.js";
// import { formatTable } from "../Controller/controller.Knife.js";
// import { runReport } from "./GA4.js";

// /**
//  * Helper function to extract event data from GA4 response
//  */
// const extractEventData = (response, eventName) => {
//   const row = response.rows?.find(r => r.dimensionValues?.[0]?.value === eventName);
//   if (!row) return { activeUsers: 0, newUsers: 0, eventCount: 0 };

//   const activeUsers = parseFloat(row.metricValues?.[3]?.value || 0);
//   const newUsers = parseFloat(row.metricValues?.[4]?.value || 0);
//   const eventCount = parseFloat(row.metricValues?.[5]?.value || 0);
//   return { activeUsers, newUsers, eventCount };
// };

// /**
//  * Helper function to calculate percentage change
//  */
// const calculatePercentChange = (current, previous) => {
//   if (!previous || previous === 0) return "N/A";
//   return (((current - previous) / previous) * 100).toFixed(2);
// };

// /**
//  * Helper function to format currency
//  */
// const formatCurrency = (value) => {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   }).format(value);
// };

// /**
//  * Helper function to add trend emoji
//  */
// const getTrendEmoji = (percentChange) => {
//   if (percentChange === "N/A") return "➖";
//   const change = parseFloat(percentChange);
//   if (change > 0) return "📈";
//   if (change < 0) return "📉";
//   return "➖";
// };

// /**
//  * Helper function to create horizontal bar chart
//  */
// const createBarChart = (value, maxValue, width = 30) => {
//   const percentage = Math.min(100, (value / maxValue) * 100);
//   const filledLength = Math.round((percentage / 100) * width);
//   const emptyLength = width - filledLength;
  
//   const bar = "█".repeat(filledLength) + "░".repeat(emptyLength);
//   return `${bar} ${percentage.toFixed(1)}%`;
// };

// /**
//  * Helper function to create comparison chart
//  */
// const createComparisonChart = (current, previous, label, isCurrency = true) => {
//   const maxValue = Math.max(current, previous);
//   const formatter = isCurrency ? formatCurrency : (v) => v.toLocaleString();
  
//   return (
//     `\n*${label}*\n` +
//     `This Period: ${formatter(current)}\n` +
//     `${createBarChart(current, maxValue)}\n` +
//     `Last Period:  ${formatter(previous)}\n` +
//     `${createBarChart(previous, maxValue)}\n`
//   );
// };

// /**
//  * Helper function to create sparkline
//  */
// const createSparkline = (values) => {
//   if (!values || values.length === 0) return "";
  
//   const min = Math.min(...values);
//   const max = Math.max(...values);
//   const range = max - min || 1;
  
//   const sparkChars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  
//   return values
//     .map(v => {
//       const normalized = (v - min) / range;
//       const index = Math.floor(normalized * (sparkChars.length - 1));
//       return sparkChars[index];
//     })
//     .join("");
// };

// /**
//  * Helper function to get country flag emoji (basic mapping)
//  */
// const getCountryFlag = (countryName) => {
//   const flagMap = {
//     "United States": "🇺🇸", "India": "🇮🇳", "United Kingdom": "🇬🇧",
//     "Canada": "🇨🇦", "Germany": "🇩🇪", "France": "🇫🇷",
//     "Japan": "🇯🇵", "Australia": "🇦🇺", "Brazil": "🇧🇷",
//     "Mexico": "🇲🇽", "Spain": "🇪🇸", "Italy": "🇮🇹",
//     "Russia": "🇷🇺", "China": "🇨🇳", "South Korea": "🇰🇷",
//     "Netherlands": "🇳🇱", "Sweden": "🇸🇪", "Switzerland": "🇨🇭",
//     "Poland": "🇵🇱", "Belgium": "🇧🇪", "Austria": "🇦🇹",
//     "Norway": "🇳🇴", "Denmark": "🇩🇰", "Finland": "🇫🇮",
//     "Ireland": "🇮🇪", "Portugal": "🇵🇹", "Greece": "🇬🇷",
//     "Turkey": "🇹🇷", "Israel": "🇮🇱", "Saudi Arabia": "🇸🇦",
//     "United Arab Emirates": "🇦🇪", "Singapore": "🇸🇬", "Malaysia": "🇲🇾",
//     "Thailand": "🇹🇭", "Indonesia": "🇮🇩", "Philippines": "🇵🇭",
//     "Vietnam": "🇻🇳", "South Africa": "🇿🇦", "Argentina": "🇦🇷",
//     "Chile": "🇨🇱", "Colombia": "🇨🇴", "Peru": "🇵🇪",
//     "Pakistan": "🇵🇰", "Bangladesh": "🇧🇩", "Egypt": "🇪🇬",
//     "Nigeria": "🇳🇬", "Kenya": "🇰🇪", "New Zealand": "🇳🇿"
//   };
//   return flagMap[countryName] || "🌐";
// };

// /**
//  * Monthly Summary Handler
//  */
// const handleMonthlySummary = async (res) => {
//   try {
//     const startDate = monthStart();
//     const { startLast, endLast } = lastMonthRanges();

//     const [response] = await analyticsDataClient.runReport({
//       property: `properties/${propertyId}`,
//       dateRanges: [{ startDate, endDate: "today" }],
//       dimensions: [{ name: "eventName" }],
//       metrics: [
//         { name: "totalRevenue" },
//         { name: "totalAdRevenue" },
//         { name: "purchaseRevenue" },
//         { name: "activeUsers" },
//         { name: "newUsers" },
//         { name: "eventCount" },
//       ],
//     });

//     const [responseLast] = await analyticsDataClient.runReport({
//       property: `properties/${propertyId}`,
//       dateRanges: [{ startDate: startLast, endDate: endLast }],
//       dimensions: [{ name: "eventName" }],
//       metrics: [
//         { name: "totalRevenue" },
//         { name: "totalAdRevenue" },
//         { name: "purchaseRevenue" },
//         { name: "activeUsers" },
//         { name: "newUsers" },
//         { name: "eventCount" },
//       ],
//     });

//     // Extract event data
//     const firstOpenThis = extractEventData(response, "first_open");
//     const appRemoveThis = extractEventData(response, "app_remove");
//     const firstOpenLast = extractEventData(responseLast, "first_open");
//     const appRemoveLast = extractEventData(responseLast, "app_remove");

//     // Extract revenue data
//     const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
//     const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
//     const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);

//     const totalRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[0]?.value || 0);
//     const adRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[1]?.value || 0);
//     const purchaseRevenueLast = parseFloat(responseLast.rows?.[0]?.metricValues?.[2]?.value || 0);

//     // Calculate percentage changes
//     const totalRevenueChange = calculatePercentChange(totalRevenue, totalRevenueLast);
//     const adRevenueChange = calculatePercentChange(adRevenue, adRevenueLast);
//     const purchaseRevenueChange = calculatePercentChange(purchaseRevenue, purchaseRevenueLast);
//     const firstOpenChange = calculatePercentChange(firstOpenThis.activeUsers, firstOpenLast.activeUsers);
//     const appRemoveChange = calculatePercentChange(appRemoveThis.activeUsers, appRemoveLast.activeUsers);

//     // Create comparison charts
//     const revenueChart = createComparisonChart(totalRevenue, totalRevenueLast, "Total Revenue Comparison", true);
//     const adRevenueChart = createComparisonChart(adRevenue, adRevenueLast, "Ad Revenue Comparison", true);
//     const purchaseRevenueChart = createComparisonChart(purchaseRevenue, purchaseRevenueLast, "Purchase Revenue Comparison", true);
//     const firstOpenChart = createComparisonChart(firstOpenThis.activeUsers, firstOpenLast.activeUsers, "First Open Users Comparison", false);
//     const appRemoveChart = createComparisonChart(appRemoveThis.activeUsers, appRemoveLast.activeUsers, "App Remove Users Comparison", false);

//     return res.send(
//       `🗡️ *KNIFE ANALYTICS - MONTHLY REPORT*\n` +
//       `${"═".repeat(45)}\n\n` +
//       `💰 *REVENUE SUMMARY*\n` +
//       `${"─".repeat(45)}\n` +
//       `*📆 This Month So Far*\n` +
//       `• Total Revenue: *${formatCurrency(totalRevenue)}* ${getTrendEmoji(totalRevenueChange)} *${totalRevenueChange}%*\n` +
//       `• Ad Revenue: *${formatCurrency(adRevenue)}* ${getTrendEmoji(adRevenueChange)} *${adRevenueChange}%*\n` +
//       `• Purchase Revenue: *${formatCurrency(purchaseRevenue)}* ${getTrendEmoji(purchaseRevenueChange)} *${purchaseRevenueChange}%*\n\n` +
//       `*🗓️ Last Month (Comparison)*\n` +
//       `• Total Revenue: *${formatCurrency(totalRevenueLast)}*\n` +
//       `• Ad Revenue: *${formatCurrency(adRevenueLast)}*\n` +
//       `• Purchase Revenue: *${formatCurrency(purchaseRevenueLast)}*\n\n` +
//       `📊 *VISUAL COMPARISON*\n` +
//       `${"─".repeat(45)}\n` +
//       `\`\`\`${revenueChart}${adRevenueChart}${purchaseRevenueChart}\`\`\`\n` +
//       `${"═".repeat(45)}\n\n` +
//       `👥 *USER METRICS*\n` +
//       `${"─".repeat(45)}\n` +
//       `*📆 This Month So Far*\n` +
//       `• *first_open* → ${firstOpenThis.activeUsers.toLocaleString()} users ${getTrendEmoji(firstOpenChange)} *${firstOpenChange}%*\n` +
//       `  └ Event Count: ${firstOpenThis.eventCount.toLocaleString()}\n` +
//       `• *app_remove* → ${appRemoveThis.activeUsers.toLocaleString()} users ${getTrendEmoji(appRemoveChange)} *${appRemoveChange}%*\n` +
//       `  └ Event Count: ${appRemoveThis.eventCount.toLocaleString()}\n\n` +
//       `*🗓️ Last Month (Comparison)*\n` +
//       `• *first_open* → ${firstOpenLast.activeUsers.toLocaleString()} users\n` +
//       `  └ Event Count: ${firstOpenLast.eventCount.toLocaleString()}\n` +
//       `• *app_remove* → ${appRemoveLast.activeUsers.toLocaleString()} users\n` +
//       `  └ Event Count: ${appRemoveLast.eventCount.toLocaleString()}\n\n` +
//       `📊 *VISUAL COMPARISON*\n` +
//       `${"─".repeat(45)}\n` +
//       `\`\`\`${firstOpenChart}${appRemoveChart}\`\`\`\n` +
//       `${"═".repeat(45)}\n` +
//       `_Generated: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC_`
//     );
//   } catch (err) {
//     console.error("❌ Monthly Summary Error:", err);
//     return res.send(`❌ *Error generating monthly summary*\n\`\`\`${err.message}\`\`\``);
//   }
// };

// /**
//  * Weekly Summary Handler
//  */
// const handleWeeklySummary = async (res) => {
//   try {
//     const { startDate, endDate } = lastWeekDate();

//     const [response] = await analyticsDataClient.runReport({
//       property: `properties/${propertyId}`,
//       dateRanges: [{ startDate, endDate }],
//       dimensions: [{ name: "eventName" }],
//       metrics: [
//         { name: "totalRevenue" },
//         { name: "totalAdRevenue" },
//         { name: "purchaseRevenue" },
//         { name: "activeUsers" },
//         { name: "newUsers" },
//         { name: "eventCount" },
//       ],
//     });

//     // Extract event data
//     const firstOpenLast = extractEventData(response, "first_open");
//     const appRemoveLast = extractEventData(response, "app_remove");

//     // Extract revenue data
//     const totalRevenue = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || 0);
//     const adRevenue = parseFloat(response.rows?.[0]?.metricValues?.[1]?.value || 0);
//     const purchaseRevenue = parseFloat(response.rows?.[0]?.metricValues?.[2]?.value || 0);

//     // Create revenue breakdown chart
//     const maxRevenue = Math.max(totalRevenue, adRevenue, purchaseRevenue);
//     const revenueBreakdownChart = (
//       `\n*Revenue Breakdown*\n` +
//       `Total:     ${formatCurrency(totalRevenue).padEnd(12)}\n${createBarChart(totalRevenue, maxRevenue)}\n` +
//       `Ad:        ${formatCurrency(adRevenue).padEnd(12)}\n${createBarChart(adRevenue, maxRevenue)}\n` +
//       `Purchase:  ${formatCurrency(purchaseRevenue).padEnd(12)}\n${createBarChart(purchaseRevenue, maxRevenue)}\n`
//     );

//     // Create user metrics chart
//     const maxUsers = Math.max(firstOpenLast.activeUsers, appRemoveLast.activeUsers);
//     const userMetricsChart = (
//       `\n*User Activity*\n` +
//       `First Open:  ${firstOpenLast.activeUsers.toLocaleString().padEnd(8)}\n${createBarChart(firstOpenLast.activeUsers, maxUsers)}\n` +
//       `App Remove:  ${appRemoveLast.activeUsers.toLocaleString().padEnd(8)}\n${createBarChart(appRemoveLast.activeUsers, maxUsers)}\n`
//     );

//     return res.send(
//       `🗡️ *KNIFE ANALYTICS - WEEKLY REPORT*\n` +
//       `${"═".repeat(45)}\n\n` +
//       `💰 *REVENUE SUMMARY*\n` +
//       `${"─".repeat(45)}\n` +
//       `*📆 Last Week (${startDate} to ${endDate})*\n` +
//       `• Total Revenue: *${formatCurrency(totalRevenue)}*\n` +
//       `• Ad Revenue: *${formatCurrency(adRevenue)}*\n` +
//       `• Purchase Revenue: *${formatCurrency(purchaseRevenue)}*\n\n` +
//       `📊 *VISUAL BREAKDOWN*\n` +
//       `${"─".repeat(45)}\n` +
//       `\`\`\`${revenueBreakdownChart}\`\`\`\n` +
//       `${"═".repeat(45)}\n\n` +
//       `👥 *USER METRICS*\n` +
//       `${"─".repeat(45)}\n` +
//       `• *first_open* → ${firstOpenLast.activeUsers.toLocaleString()} users\n` +
//       `  └ Event Count: ${firstOpenLast.eventCount.toLocaleString()}\n` +
//       `• *app_remove* → ${appRemoveLast.activeUsers.toLocaleString()} users\n` +
//       `  └ Event Count: ${appRemoveLast.eventCount.toLocaleString()}\n\n` +
//       `📊 *VISUAL BREAKDOWN*\n` +
//       `${"─".repeat(45)}\n` +
//       `\`\`\`${userMetricsChart}\`\`\`\n` +
//       `${"═".repeat(45)}\n` +
//       `_Generated: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC_`
//     );
//   } catch (err) {
//     console.error("❌ Weekly Summary Error:", err);
//     return res.send(`❌ *Error generating weekly summary*\n\`\`\`${err.message}\`\`\``);
//   }
// };

// /**
//  * Revenue by Country Handler
//  */
// const handleRevenueByCountry = async (res, days, label) => {
//   try {
//     const startDate = lastdays(days);
//     const [response] = await runReport(startDate, "today", "country", "totalRevenue");

//     const rows = response.rows?.map(r => ({
//       Country: r.dimensionValues?.[0]?.value || "(not set)",
//       Total_Revenue: r.metricValues?.[0]?.value || "0",
//     })) || [];

//     if (rows.length === 0) {
//       return res.send(`ℹ️ *No revenue data available for ${label}*`);
//     }

//     rows.sort((a, b) => Number(b.Total_Revenue) - Number(a.Total_Revenue));
//     const top10 = rows.slice(0, 10);

//     // Calculate total revenue
//     const totalRevenue = rows.reduce((sum, row) => sum + Number(row.Total_Revenue), 0);

//     // Create visual chart for top 10
//     const maxRevenue = Number(top10[0]?.Total_Revenue || 0);
//     const chartLines = top10.map((row, index) => {
//       const revenue = Number(row.Total_Revenue);
//       const bar = createBarChart(revenue, maxRevenue, 25);
//       const flag = getCountryFlag(row.Country);
//       return `${(index + 1).toString().padStart(2)}. ${flag} ${row.Country.padEnd(20)} ${formatCurrency(revenue).padStart(12)}\n    ${bar}`;
//     }).join("\n");

//     const title = `🗡️ *KNIFE ANALYTICS - REVENUE BY COUNTRY*\n${label} (Top 10)\n${"═".repeat(45)}`;
//     const table = formatTable(top10, ["Country", "Total_Revenue"], true, "USD");
//     const visualChart = `\n📊 *VISUAL CHART*\n${"─".repeat(45)}\n\`\`\`\n${chartLines}\n\`\`\``;
//     const footer = `\n${"─".repeat(45)}\n*Total Revenue (All Countries):* ${formatCurrency(totalRevenue)}\n*Countries Tracked:* ${rows.length}\n_Generated: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC_`;

//     res.type("text/plain");
//     return res.send(`${title}\n${table}${visualChart}${footer}`);
//   } catch (err) {
//     console.error(`❌ Revenue by Country Error (${label}):`, err);
//     res.status(200).send(`❌ *Error generating revenue report for ${label}*\n\`\`\`${err.message}\`\`\``);
//   }
// };

// /**
//  * Main Interactions Handler
//  */
// export const Interactions = async (req, res) => {
//   try {
//     const payload = JSON.parse(req.body.payload);
//     const action = payload.actions[0];
//     const responseUrl = payload.response_url;

//     switch (action.value) {
//       case "knife_summary_monthly":
//         return await handleMonthlySummary(res);

//       case "knife_weekly_summary":
//         return await handleWeeklySummary(res);

//       case "knife_revenue_7":
//         return await handleRevenueByCountry(res, 6, "Last 7 Days");

//       case "knife_revenue_30":
//         return await handleRevenueByCountry(res, 29, "Last 30 Days");

//       case "knife_revenue_24hr":
//         return await handleRevenueByCountry(res, 1, "Last 24 Hours");

//       default:
//         return res.status(200).send("❌ *Unknown Action*\nPlease select a valid option from the menu.");
//     }
//   } catch (err) {
//     console.error("❌ Interaction Error:", err);
//     return res.status(200).send(`❌ *Interaction Error*\n\`\`\`${err.message}\`\`\``);
//   }
// };