import { AppHttpService } from "..";
import type {
  profileItemDAO,
  UserProfileData,
  topCreatorDAO,
  topCreatorItem,
  newCreatorItem,
  searchUserDTO,
  searchUserDAO,
  peopleDiscoverySearchDTO,
  usernameSearchDTO,
  usernameSearchDAO,
  usernameAvailableDTO,
  usernameAvailableDAO,
  MentionSearchDTO,
  MentionSearchDAO,
  notificationDTO,
  notificationItemDAO,
  updateAccountDTO,
  completeOnboardingDTO,
  PrivacySettingsDAO,
  UpdatePrivacySettingsDTO,
  NotificationSettingsDAO,
  UpdateNotificationSettingsDTO,
  RegisterNotificationTokenDTO,
} from "./types";
import type { UnifiedSearchPersonDAO } from "../search-api/type";

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
    return await this.SendRequest<notificationItemDAO[]>({
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
  async markNotificationAsRead(id: string) {
    return await this.SendRequest<notificationItemDAO>({
      method: "patch",
      path: `/notifications/${id}`,
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
  async searchPeople(dto: peopleDiscoverySearchDTO) {
    const query: Record<string, unknown> = { scope: "all" };
    if (dto.query) query.query = dto.query;
    if (dto.matchMin !== undefined) query.match_min = dto.matchMin;
    if (dto.matchMax !== undefined) query.match_max = dto.matchMax;
    if (dto.limit !== undefined) query.limit = dto.limit;

    return await this.SendRequest<UnifiedSearchPersonDAO[]>({
      method: "get",
      path: "/search-friends",
      query,
    });
  }
  async searchByUsername(dto: usernameSearchDTO) {
    return await this.SendRequest<usernameSearchDAO>({
      method: "get",
      path: "/username-search",
      query: { username: dto.username },
    });
  }
  async checkUsernameAvailable(dto: usernameAvailableDTO) {
    return await this.SendRequest<usernameAvailableDAO>({
      method: "get",
      path: "/username-available",
      query: { username: dto.username },
    });
  }
  async searchMentions(dto: MentionSearchDTO) {
    return await this.SendRequest<MentionSearchDAO>({
      method: "get",
      path: "/mention-search",
      query: { q: dto.q },
    });
  }
  async unfollowUser(userId: string) {
    return await this.SendRequest({
      method: "delete",
      path: `/${userId}/follow`,
    });
  }
  async getPrivacySettings() {
    return await this.SendRequest<PrivacySettingsDAO>({
      method: "get",
      path: "/privacy-settings",
    });
  }
  async updatePrivacySettings(dto: UpdatePrivacySettingsDTO) {
    return await this.SendRequest<PrivacySettingsDAO>({
      method: "patch",
      path: "/privacy-settings",
      body: dto,
    });
  }
  async getNotificationSettings() {
    return await this.SendRequest<NotificationSettingsDAO>({
      method: "get",
      path: "/notification-settings",
    });
  }
  async updateNotificationSettings(dto: UpdateNotificationSettingsDTO) {
    return await this.SendRequest<NotificationSettingsDAO>({
      method: "patch",
      path: "/notification-settings",
      body: dto,
    });
  }
  async registerNotificationToken(dto: RegisterNotificationTokenDTO) {
    return await this.SendRequest({
      method: "post",
      path: "/notification-token",
      body: dto,
    });
  }
}

export default new AccountService();
