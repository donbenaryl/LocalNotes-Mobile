import { AppHttpService } from "..";
import type {
  profileItemDAO,
  UserProfileData,
  topCreatorDAO,
  topCreatorItem,
  newCreatorItem,
  searchUserDTO,
  searchUserDAO,
  usernameSearchDTO,
  usernameSearchDAO,
  notificationDTO,
  notificationDAO,
  updateAccountDTO,
  completeOnboardingDTO,
} from "./types";

class AccountService extends AppHttpService {
  constructor() {
    super({
      baseURL: "/accounts",
    });
  }
  async fetchUser() {
    return await this.SendRequest<profileItemDAO>({
      method: "get",
      path: "/profile",
    });
  }
  async completeOnboarding(dto: completeOnboardingDTO) {
    return await this.SendRequest<profileItemDAO>({
      method: "patch",
      path: "/onboarding",
      body: dto,
    });
  }
  async fetchOtherUser(userId: string) {
    return await this.SendRequest<profileItemDAO>({
      method: "get",
      path: `/${userId}/profile`,
    });
  }
  async creatPersonalityProfile(dto: any) {
    return await this.SendRequest<UserProfileData>({
      method: "post",
      path: `/personality-profile`,
      body: dto,
    });
  }
    async createWaitlist(dto: any) {
    return await this.SendRequest({
      method: "post",
      path: `/waitlist`,
      body: dto,
    });
  }
  async getPersonalityProfile() {
    return await this.SendRequest<UserProfileData>({
      method: "get",
      path: `/personality-profile`,
      
    });
  }
  async fetchTopCreators(dto: { account_type: string; limit?: number }) {
    return await this.SendRequest<topCreatorItem[]>({
      method: "get",
      path: `/top-creators`,
      query: dto,
    });
  }
  async fetchNewCreators() {
    return await this.SendRequest<newCreatorItem[]>({
      method: "get",
      path: `/new-creators`,
    });
  }
  async followUser(userId: string) {
    return await this.SendRequest({
      method: "post",
      path: `/${userId}/follow`,
    });
  }
  async getNotification(dto:notificationDTO) {
    return await this.SendRequest<notificationDAO>({
      method: "get",
      path: "/notifications",
      query:dto,
    });
  }
  async getNotificationCount() {
    return await this.SendRequest({
      method: "get",
      path: "/notifications/count",
    });
  }
  async markAllNotificationsAsRead() {
    return await this.SendRequest({
      method: "post",
      path: "/notifications",
    });
  }
    async updateAccount(dto: updateAccountDTO) {
    return await this.SendRequest<profileItemDAO>({
      method: "patch",
      path: "/profile",
      body: dto
    });
  }
      async updateAccountImage(dto:any) {
    return await this.SendRequest<profileItemDAO>({
      method: "patch",
      path: "/profile-image",
      body:dto
    });
  }
  async searchUser(dto: searchUserDTO) {
    return await this.SendRequest<searchUserDAO[]>({
      method: "get",
      path: "/search-friends",
      query: dto,
    });
  }
  async searchByUsername(dto: usernameSearchDTO) {
    return await this.SendRequest<usernameSearchDAO>({
      method: "get",
      path: "/username-search",
      query: { username: dto.username },
    });
  }
  async unfollowUser(userId: string) {
    return await this.SendRequest({
      method: "delete",
      path: `/${userId}/follow`,
    });
  }
}

export default new AccountService();
