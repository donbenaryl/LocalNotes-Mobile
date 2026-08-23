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
    OwnedBusinessDAO,
    StatsDateRangeParams,
    BusinessClaimDAO,
    ClaimableBusinessDAO,
    ClaimablePickDAO,
    SearchClaimableDTO,
    SubmitClaimDTO,
    ClaimOtpTargetDTO,
    ClaimOtpVerifyDTO,
    ClaimEmailOtpStartDAO,
    ClaimPhoneOtpStartDAO,
    BusinessTypeDAO,
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
    async fetchBusinessTypes(){
       return await this.SendRequest<BusinessTypeDAO[]>({
        method:"get",
        path:"/types",
       })
    }
    async searchBusiness(dto: searchBusinessDTO){
       const query: Record<string, unknown> = {};
       if (dto.query) query.query = dto.query;
       if (dto.match) query.match = dto.match;
       if (dto.city) query.city = dto.city;
       if (dto.region) query.region = dto.region;
       if (dto.latitude !== undefined && dto.longitude !== undefined) {
         query.latitude = dto.latitude;
         query.longitude = dto.longitude;
         if (dto.radiusKm !== undefined) query.radius_km = dto.radiusKm;
       }
       return await this.SendRequest<BusinessItemDAO[]>({
        method:"get",
        path:"/",
        query,
       })
    }
    async getBusinessInfo(){
       return await this.SendRequest<BusinessItemDAO>({
        method:"get",
        path:"/info",
       })
    }
    async fetchOwnedBusinesses(){
       return await this.SendRequest<OwnedBusinessDAO[]>({
        method:"get",
        path:"/mine",
       })
    }
    async setPrimaryBusiness(businessId: string){
       return await this.SendRequest<OwnedBusinessDAO[], { business_id: string }>({
        method:"patch",
        path:"/primary",
        body: { business_id: businessId },
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

    async submitBusinessClaim(dto: SubmitClaimDTO) {
        const formData = new FormData();
        formData.append("verification_method", dto.verification_method ?? "document");
        formData.append("work_email", dto.work_email);
        formData.append("proof_of_ownership", dto.proof_of_ownership as never);
        if (dto.phone_number) formData.append("phone_number", dto.phone_number);

        if (dto.business) formData.append("business", dto.business);
        if (dto.list_item) formData.append("list_item", dto.list_item);
        if (dto.source) formData.append("source", dto.source);
        if (dto.proposed_name) formData.append("proposed_name", dto.proposed_name);
        if (dto.proposed_business_type) {
            formData.append("proposed_business_type", dto.proposed_business_type);
        }
        if (dto.proposed_website) {
            formData.append("proposed_website", dto.proposed_website);
        }
        if (dto.proposed_location) {
            const loc = dto.proposed_location;
            if (loc.street_address != null) {
                formData.append("proposed_location[street_address]", loc.street_address);
            }
            if (loc.postal_code != null) {
                formData.append("proposed_location[postal_code]", loc.postal_code);
            }
            formData.append("proposed_location[city]", loc.city);
            formData.append("proposed_location[region]", loc.region);
            formData.append("proposed_location[country]", loc.country);
            formData.append("proposed_location[latitude]", String(loc.latitude));
            formData.append("proposed_location[longitude]", String(loc.longitude));
        }

        return await this.SendRequest<BusinessClaimDAO, FormData>({
            method: "post",
            path: "/claim-business",
            body: formData,
        });
    }

    async startClaimEmailOtp(dto: ClaimOtpTargetDTO) {
        return await this.SendRequest<ClaimEmailOtpStartDAO, ClaimOtpTargetDTO>({
            method: "post",
            path: "/claim-business/start-email-otp",
            body: dto,
        });
    }

    async verifyClaimEmailOtp(dto: ClaimOtpVerifyDTO) {
        return await this.SendRequest<BusinessClaimDAO, ClaimOtpVerifyDTO>({
            method: "post",
            path: "/claim-business/verify-email-otp",
            body: dto,
        });
    }

    async startClaimPhoneOtp(dto: ClaimOtpTargetDTO) {
        return await this.SendRequest<ClaimPhoneOtpStartDAO, ClaimOtpTargetDTO>({
            method: "post",
            path: "/claim-business/start-phone-otp",
            body: dto,
        });
    }

    async verifyClaimPhoneOtp(dto: ClaimOtpVerifyDTO) {
        return await this.SendRequest<BusinessClaimDAO, ClaimOtpVerifyDTO>({
            method: "post",
            path: "/claim-business/verify-phone-otp",
            body: dto,
        });
    }

    async fetchMyBusinessClaims() {
        return await this.SendRequest<BusinessClaimDAO[]>({
            method: "get",
            path: "/claims/mine",
        });
    }

    async searchClaimableBusinesses(dto: SearchClaimableDTO = {}) {
        const query: Record<string, unknown> = {};
        if (dto.query) query.query = dto.query;
        if (dto.page !== undefined) query.page = dto.page;
        return await this.SendRequest<ClaimableBusinessDAO[]>({
            method: "get",
            path: "/claimable",
            query,
        });
    }

    async searchClaimablePicks(dto: SearchClaimableDTO = {}) {
        const query: Record<string, unknown> = {};
        if (dto.query) query.query = dto.query;
        if (dto.page !== undefined) query.page = dto.page;
        return await this.SendRequest<ClaimablePickDAO[]>({
            method: "get",
            path: "/claimable-picks",
            query,
        });
    }
}

export default new BusinessService()