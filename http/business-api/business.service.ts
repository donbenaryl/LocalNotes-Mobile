import { AppHttpService } from "..";
import type { RNFile } from "../types";
import type {
    BusinessItemDAO,
    BusinessDAO,
    searchBusinessDTO,
    UpdateBusinessDTO,
    AddBranchDTO,
    BusinessViewsStatsDAO,
    BusinessMentionsStatsDAO,
    BusinessCategoryStatItemDAO,
    BusinessListStatItemDAO,
    BusinessPersonalityColorStatItemDAO,
    BusinessUniqueUsersReachedStatsDAO,
    BusinessTotalListSavesStatsDAO,
    StatsDateRangeParams,
} from "./types";
import type { NoteDAO } from "../notes-api/types";

class BusinessService extends AppHttpService{
    constructor(){
        super({
            baseURL:"/businesses"
        })
    }
    async fetchBusiness(){
       return await this.SendRequest<BusinessItemDAO[]>({
        method:"get",
        path:"/"
       })
    }
    async searchBusiness(dto: searchBusinessDTO){
       return await this.SendRequest<BusinessItemDAO[], Record<string, unknown>, searchBusinessDTO>({
        method:"get",
        path:"/",
        query:dto,
       })
    }
    async getBusinessInfo(){
       return await this.SendRequest<BusinessItemDAO>({
        method:"get",
        path:"/info",
       })
    }
    async updateBusiness(dto: UpdateBusinessDTO){
        const formData = new FormData();
        if (dto.name !== undefined) formData.append("name", dto.name);
        if (dto.business_type !== undefined) formData.append("business_type", dto.business_type);
        if (dto.contact_email !== undefined) formData.append("contact_email", dto.contact_email);
        if (dto.phone_number !== undefined) formData.append("phone_number", dto.phone_number);
        if (dto.website !== undefined) formData.append("website", dto.website);
        if (dto.bio !== undefined) formData.append("bio", dto.bio);
        return await this.SendRequest<BusinessItemDAO, FormData>({
            method:"patch",
            path:"/update-business",
            body: formData,
        })
    }
    async addBranch(dto: AddBranchDTO) {
        return await this.SendRequest<BusinessItemDAO, AddBranchDTO>({
            method: "post",
            path: "/add-branch",
            body: dto,
        });
    }
    async uploadLogo(file: RNFile) {
        const formData = new FormData();
        formData.append("logo", file as never);
        return await this.SendRequest<BusinessItemDAO, FormData>({
            method: "post",
            path: "/logo",
            body: formData,
        });
    }
    async deleteLogo() {
        return await this.SendRequest<BusinessItemDAO>({
            method: "delete",
            path: "/logo",
        });
    }
    async deleteBranch(branchId: string) {
        return await this.SendRequest<BusinessItemDAO>({
            method: "delete",
            path: `/branches/${branchId}`,
        });
    }
    async getBusinessById(businessId: string) {
        return await this.SendRequest<BusinessItemDAO>({
            method: "get",
            path: `/${businessId}`,
        });
    }
    async followBusiness(businessId: string) {
        return await this.SendRequest({
            method: "post",
            path: `/${businessId}/follow`,
        });
    }
    async unfollowBusiness(businessId: string) {
        return await this.SendRequest({
            method: "delete",
            path: `/${businessId}/follow`,
        });
    }
    async fetchBusinessNotes(businessId: string) {
        return await this.SendRequest<NoteDAO[]>({
            method: "get",
            path: `/${businessId}/notes`,
        });
    }
    async recordView(businessId: string) {
        return await this.SendRequest({
            method: "post",
            path: `/${businessId}/view`,
        });
    }
    async getViewsStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessViewsStatsDAO, Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/views`,
            query: params,
        });
    }
    async getMentionsStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessMentionsStatsDAO, Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/mentions`,
            query: params,
        });
    }
    async getCategoriesStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessCategoryStatItemDAO[], Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/categories`,
            query: params,
        });
    }
    async getListsStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessListStatItemDAO[], Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/lists`,
            query: params,
        });
    }
    async getPersonalityColorStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessPersonalityColorStatItemDAO[], Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/personality-colors`,
            query: params,
        });
    }
    async getUniqueUsersReachedStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessUniqueUsersReachedStatsDAO, Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/unique-users-reached`,
            query: params,
        });
    }
    async getTotalListSavesStats(businessId: string, params?: StatsDateRangeParams) {
        return await this.SendRequest<BusinessTotalListSavesStatsDAO, Record<string, unknown>, StatsDateRangeParams>({
            method: "get",
            path: `/${businessId}/stats/total-list-saves`,
            query: params,
        });
    }
}

export default new BusinessService()