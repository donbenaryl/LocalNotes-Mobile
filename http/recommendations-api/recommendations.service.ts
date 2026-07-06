import { AppHttpService } from "..";
import type { similarCreatorItem, similarUserScore } from "./types";

class RecommendationService extends AppHttpService{
    constructor() {
    super({
      baseURL: "/recommendations",
    });
    }
async fetchSimilarUsers(userId:string){
       return await this.SendRequest<similarCreatorItem[]>({
        method:"get",
        path:`/users/${userId}/similar-users`,
       }) 
    }
async fetchSimilarScores(userId:string){
       return await this.SendRequest<similarUserScore>({
        method:"get",
        path:`/users/${userId}/similarity`,
       }) 
    }
    
}

export default new RecommendationService()