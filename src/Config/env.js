import { configDotenv } from "dotenv";

configDotenv({
    path:`.env.${process.env.NODE_ENV || 'development'}`
});

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const port = process.env.PORT || 3000;
export const slackBotToken = required('SLACK_BOT_TOKEN');
export const slackSigningSecret = required('SLACK_SIGNING_SECRET');
export const slackChannelId = required('SLACK_CHANNEL_ID');
export const propertyId = required('GA4_PROPERTY_ID');

export const ga4 = {
  projectId: required('GA4_PROJECT_ID'),
  privateKeyId: required('GA4_PRIVATE_KEY_ID'),
  privateKey: required('GA4_PRIVATE_KEY').replace(/\\n/g, '\n'),
  clientEmail: required('GA4_CLIENT_EMAIL'),
  clientId: required('GA4_CLIENT_ID'),
  clientX509CertUrl: required('GA4_CLIENT_X509_CERT_URL')
};