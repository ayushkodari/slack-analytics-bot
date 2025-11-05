import { slackChannelId } from "../Config/env.js";
import { slack_init } from "../Config/slack.js";

export const sendSlackMessageChannel = async (text)=>{
    try{
        await slack_init().chat.postMessage({
            channel:slackChannelId,
            text
        });
    }catch(err){
        console.error("⚠️ Failed to send Slack message:", err);
    }
}
