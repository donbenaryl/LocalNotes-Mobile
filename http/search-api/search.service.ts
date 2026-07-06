import { AppHttpService } from "..";
import type {
  UnifiedSearchParams,
  UnifiedSearchPeopleQueryDTO,
  UnifiedSearchPeopleResultDAO,
  UnifiedSearchResultDAO,
} from "./type";

class SearchService extends AppHttpService {
  constructor() {
    super({});
  }

  async unifiedSearch(params: UnifiedSearchParams) {
    const queryParams: Record<string, unknown> = {
      query: params.query,
      type: params.type,
    };

    const categoryIds = params.categoryIds ?? [];
    if (categoryIds.length > 0) {
      queryParams.categories = categoryIds.join(",");
    }

    if (params.longitude !== undefined && params.latitude !== undefined) {
      queryParams.longitude = params.longitude;
      queryParams.latitude = params.latitude;
    }

    if (params.radiusKm !== undefined) {
      queryParams.radius_km = params.radiusKm;
    }

    if (params.matchMin !== undefined) {
      queryParams.match_min = params.matchMin;
    }

    if (params.matchMax !== undefined) {
      queryParams.match_max = params.matchMax;
    }

    const vibes = params.vibes ?? [];
    if (vibes.length > 0) {
      queryParams.vibe = vibes.join(",");
    }

    if (params.sortBy) {
      queryParams.sort_by = params.sortBy;
    }

    if (params.sortOrder) {
      queryParams.sort_order = params.sortOrder;
    }

    if (params.limit !== undefined) {
      queryParams.limit = params.limit;
    }

    return await this.SendRequest<UnifiedSearchResultDAO>({
      method: "get",
      path: "/unified-search",
      query: queryParams,
    });
  }

  async fetchStarterPeople(
    query: UnifiedSearchPeopleQueryDTO = {
      scope: "people",
      limit: 6,
      sort_by: "match",
      sort_order: "desc",
    },
  ) {
    return await this.SendRequest<UnifiedSearchPeopleResultDAO>({
      method: "get",
      path: "/unified-search",
      query,
    });
  }
}

export default new SearchService();
