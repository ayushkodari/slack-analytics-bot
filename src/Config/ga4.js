import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { ga4 } from "./env.js";

export const analyticsDataClient = new BetaAnalyticsDataClient({
credentials:{
  "type": "service_account",
  "project_id": ga4.projectId,
  "private_key_id": ga4.privateKeyId,
  "private_key": ga4.privateKey,
  "client_email": ga4.clientEmail,
  "client_id": ga4.clientId,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": ga4.clientX509CertUrl,
  "universe_domain": "googleapis.com"
}
});