import { AppHttpService } from "..";
import type { AdminUserItem, BulkDeleteDTO } from "./types";

class AdminService extends AppHttpService {
  constructor() {
    super({ baseURL: "/accounts" });
  }

  async fetchUsers(page: number = 1, search: string = "") {
    return await this.SendRequest<AdminUserItem[]>({
      method: "get",
      path: "/admin/users",
      query: search.trim() ? { page, search: search.trim() } : { page },
    });
  }

  async deleteUsers(dto: BulkDeleteDTO) {
    return await this.SendRequest({
      method: "delete",
      path: "/admin/delete-accounts",
      body: dto,
    });
  }
}

export default new AdminService();
