import {WebClient,LogLevel} from "@slack/web-api";

export const slack_init = (token)=> new WebClient(token, { logLevel: LogLevel.DEBUG });

export const sendSlackMessage =async (slack_init,channel,text)=>{
    try{
        await slack_init.chat.postMessage({
            channel,
            text
        });
    }catch(err){
        console.error("⚠️ Failed to send Slack message:", err);
    }
}
