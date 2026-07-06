import { AppHttpService } from "..";
import type { PreviousConversation, ConversationRequest, DetailedConversation, WebResult } from "./types";

class SmartPickService extends AppHttpService{
    constructor() {
    super({
      baseURL: "/smart-pick",
    });
    }
async fetchConversations(){
       return await this.SendRequest<PreviousConversation[]>({
        method:"get",
        path:`/`,
       })
    }
    async makeConversations(dto:ConversationRequest){
       return await this.SendRequest<DetailedConversation>({
        method:"post",
        path:`/`,
        body:dto
       })
    }
    async fetchDetailedConversations(sessionId: string){
       return await this.SendRequest<DetailedConversation>({
        method:"get",
        path:`/sessions/${sessionId}`,
       })
    }
    async fetchWebSuggestions(sessionId: string) {
        return await this.SendRequest<WebResult[]>({
            method: "post",
            path: `/sessions/${sessionId}/web`,
        })
    }

    async getWebSuggestions(sessionId: string) {
        return await this.SendRequest<WebResult[]>({
            method: "get",
            path: `/sessions/${sessionId}/web`,
        })
    }

}

export default new SmartPickService()