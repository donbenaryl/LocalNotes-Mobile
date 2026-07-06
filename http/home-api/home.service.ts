import { AppHttpService } from "..";
import type { activitiesDTO, ActivitiesDAO, ActivityItemDAO,  categoriesItemDAO } from "./type";

class HomeService extends AppHttpService{
    constructor() {
    super({
      baseURL: "/lists",
    });
    }
    async fetchActivities(){
      return await this.SendRequest<ActivityItemDAO[]>({
        method:"get",
        path:"/activity-feed",
      })
    }
    async fetchCategories(){
      return await this.SendRequest<categoriesItemDAO[]>({
        method:"get",
        path:"/categories",
      })
    }
    
}

export default new HomeService()