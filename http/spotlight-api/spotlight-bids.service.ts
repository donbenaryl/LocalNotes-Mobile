import { AppHttpService } from "..";
import type {
  SpotlightBidCitiesDQO,
  SpotlightBidRoundDAO,
  SpotlightBidRoundDQO,
} from "./type";

// Read-only on mobile. Placing bids and paying happens on the web app.
class SpotlightBidsService extends AppHttpService {
  constructor() {
    super({ baseURL: "/spotlight/bids" });
  }

  async fetchCities(businessId: string) {
    return await this.SendRequest<string[], unknown, SpotlightBidCitiesDQO>({
      method: "get",
      path: "/cities",
      query: { business_id: businessId },
    });
  }

  async fetchRound(businessId: string, city: string) {
    return await this.SendRequest<SpotlightBidRoundDAO, unknown, SpotlightBidRoundDQO>({
      method: "get",
      path: "/round",
      query: { business_id: businessId, city },
    });
  }
}

export default new SpotlightBidsService();
