import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";

export const runReport = async ()=>{
    const [response] = await analyticsDataClient.runReport({
        property:`properties/${propertyId}`,
        dateRanges: [
      {
        startDate: '2025-09-30',
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
        name: 'activeUsers',
      },
    ],
    })
    console.log(response);
}