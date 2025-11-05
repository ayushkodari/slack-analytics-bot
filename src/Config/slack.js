import { WebClient,LogLevel } from "@slack/web-api";
import { slackBotToken } from "./env.js";

export const slack_init = () => new WebClient(slackBotToken, { logLevel: LogLevel.DEBUG });