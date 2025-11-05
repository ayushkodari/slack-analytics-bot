import { BetaAnalyticsDataClient } from "@google-analytics/data";

export const GA4 = {
  "type": "service_account",
  "project_id": process.env.GA4_PROJECT_ID,
  "private_key_id": process.env.GA4_PRIVATE_KEY_ID,
  "private_key": process.env.GA4_PRIVATE_KEY,
  "client_email": process.env.GA4_CLIENT_EMAIL,
  "client_id": process.env.GA4_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.GA4_CLIENT_X509_CERT_URL,
  "universe_domain": "googleapis.com"
}

const analyticsDataClient = new BetaAnalyticsDataClient({
key:GA4
});

export const runReport = async ()=>{
    const [response] = await analyticsDataClient.runReport({
        property:`properties/${process.env.GA4_PROPERTY_ID}`,
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