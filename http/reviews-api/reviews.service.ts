import { AppHttpService } from "..";
import type {
  GoogleConnectDTO,
  ImportedReviewDAO,
  ReviewConnectionDAO,
  ReviewProviderId,
  ReviewSummaryDAO,
} from "./types";

class ReviewsService extends AppHttpService {
  constructor() {
    super({
      baseURL: "/reviews",
    });
  }

  async fetchConnections() {
    return await this.SendRequest<ReviewConnectionDAO[]>({
      method: "get",
      path: "/connections",
    });
  }

  async connectGoogle(body: GoogleConnectDTO) {
    return await this.SendRequest<ReviewConnectionDAO>({
      method: "post",
      path: "/connections/google",
      body,
    });
  }

  async disconnectGoogle() {
    return await this.SendRequest<ReviewConnectionDAO>({
      method: "delete",
      path: "/connections/google",
    });
  }

  async fetchReviews(query?: {
    user_id?: string;
    provider?: ReviewProviderId;
    page?: number;
  }) {
    return await this.SendRequest<ImportedReviewDAO[]>({
      method: "get",
      path: "/",
      query: query && Object.keys(query).length > 0 ? query : undefined,
    });
  }

  async fetchSummary(query?: { user_id?: string }) {
    return await this.SendRequest<ReviewSummaryDAO>({
      method: "get",
      path: "/summary",
      query: query && Object.keys(query).length > 0 ? query : undefined,
    });
  }

  async syncReviews() {
    return await this.SendRequest<ReviewConnectionDAO>({
      method: "post",
      path: "/sync",
      options: { throwError: true },
    });
  }
}

const reviewsService = new ReviewsService();
export default reviewsService;
