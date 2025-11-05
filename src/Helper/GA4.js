import { analyticsDataClient } from "../Config/ga4.js";
import { propertyId } from "../Config/env.js";

export const runReport = async (startDate,endDate,dimensionsValue,metricsValue)=>{
    const response = await analyticsDataClient.runReport({
        property:`properties/${propertyId}`,
        dateRanges: [
      {
        startDate,
        endDate,
      },
    ],
    dimensions: [
      {
        name: dimensionsValue,
      },
    ],
    metrics: [
      {
        name: metricsValue,
      },
    ],
    })
    return response;
}