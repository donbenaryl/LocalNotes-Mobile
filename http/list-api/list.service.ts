import { AppHttpService } from "..";
import type { RNFile } from "../types";
import type { CreateListDTO, serchDTO, ListItemDAO, listDTO, Category, userListDTO, listedDTO, Comment, ListItemPublic, CreateListItemDTO, UpdateListItemDTO, Item, MatchHistogramDAO } from "./types";

class ListService extends AppHttpService{
    constructor() {
    super({
      baseURL: "/lists",
    });
    }
    async fetchLists(dto:listedDTO){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/",
        query:dto
      
      })
    }
     async fetchUserLists(dto:userListDTO){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:`/accounts/${dto.userId}`,
        query:dto,
      
      })
    }
    async fethFollowingList(category?:string){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path: "/following-lists",
        query: { category }
      })
    }
    async fethSimilarList(){
      return await this.SendRequest<Category[]>({
        method:"get",
        path: "/aggregated-categories"
      })
    }
    async pinLists(listId:string){
      return await this.SendRequest<ListItemDAO[]>({
        method:"post",
        path:`/${listId}/pin`,
      
      })
    }    
    async updateList(listId:string, dto:CreateListDTO){
      return await this.SendRequest<ListItemDAO>({
        method:"patch",
        path:`/${listId}`,
        body:dto
      })
    } 
    async retrieveList(listId:string){
      return await this.SendRequest<ListItemDAO>({
        method:"get",
        path:`/${listId}`,
      
      })
    }   
    async deleteList(listId:string){
      return await this.SendRequest<ListItemDAO[]>({
        method:"delete",
        path:`/${listId}`,
      
      })
    }
    async unpinLists(listId:string){
      return await this.SendRequest<ListItemDAO[]>({
        method:"delete",
        path:`/${listId}/pin`,
      })
    }
    async saveUnsaveList(listId:string){
      return await this.SendRequest({
        method:"post",
        path:`/${listId}/save`,
      })
    }
     async shareList(listId:string, medium:string | null){
      return await this.SendRequest({
        method:"post",
        path:`/${listId}/share`,
        body: { medium }
      })
    }
        async likeUnlikeList(listId:string){
      return await this.SendRequest({
        method:"post",
        path:`/${listId}/like`,
      })
    }
    async fetchTrendingLists(dto?: { limit?: number }){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/trending-lists",
        query: dto,
      })
    }
    async fetchTopLists(){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/top-creators-lists",
      })
    }
    async fetchCommunityPicks(dto?: { limit?: number }){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/community-pick",
        query: dto,
      })
    }
    async fetchOtherLists(dto:listDTO){
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/other-lists",
        query:dto,
      })
    }
async fetchListComments(listId: string, params?: { page?: number; parent_comment?: string }) {
  return await this.SendRequest<Comment[]>({
    method: "get",
    path: `/${listId}/comments`,
    query: params,  
  });
}
    async createListComment(listId:string, dto:{content:string; mentioned_account_ids?: string[]}, parent?: string){
      return await this.SendRequest<Comment>({
        method:"post",
        path:`/${listId}/comments`,
        body:dto,
        query: parent ? { parent_comment: parent } : undefined,
      })
    }
     async likeUnlikeComment(commentId:string){
      return await this.SendRequest({
        method:"post",
        path:`/comments/${commentId}/like`,
      })
    }
    async searchLists(dto:serchDTO){
      const query: Record<string, unknown> = {};
      if (dto.query) query.query = dto.query;
      if (dto.matchMin !== undefined) query.match_min = dto.matchMin;
      if (dto.matchMax !== undefined) query.match_max = dto.matchMax;
      if (dto.vibe?.length) query.vibe = dto.vibe.join(",");
      if (dto.personalitySides?.length) query.personality_sides = dto.personalitySides.join(",");
      if (dto.categoryIds?.length) query.category_ids = dto.categoryIds.join(",");
      if (dto.listItemId) query.list_item_id = dto.listItemId;
      if (dto.city) query.city = dto.city;
      if (dto.region) query.region = dto.region;
      if (dto.latitude !== undefined && dto.longitude !== undefined) {
        query.latitude = dto.latitude;
        query.longitude = dto.longitude;
        if (dto.radiusKm !== undefined) query.radius_km = dto.radiusKm;
      }
      if (dto.limit !== undefined) query.limit = dto.limit;
      if (dto.sortBy) query.sort_by = dto.sortBy;
      if (dto.sortOrder) query.sort_order = dto.sortOrder;

      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/search",
        query,
      })
    }

    async fetchListsMatchHistogram(dto: Omit<serchDTO, "matchMin" | "matchMax" | "limit" | "sortBy" | "sortOrder">) {
      const query: Record<string, unknown> = {};
      if (dto.query) query.query = dto.query;
      if (dto.vibe?.length) query.vibe = dto.vibe.join(",");
      if (dto.personalitySides?.length) query.personality_sides = dto.personalitySides.join(",");
      if (dto.categoryIds?.length) query.category_ids = dto.categoryIds.join(",");
      if (dto.city) query.city = dto.city;
      if (dto.region) query.region = dto.region;
      if (dto.latitude !== undefined && dto.longitude !== undefined) {
        query.latitude = dto.latitude;
        query.longitude = dto.longitude;
        if (dto.radiusKm !== undefined) query.radius_km = dto.radiusKm;
      }
      return await this.SendRequest<MatchHistogramDAO>({
        method: "get",
        path: "/search/match-histogram",
        query,
      });
    }

    async fetchPicksMatchHistogram(params?: {
      keyword?: string;
      vibes?: string[];
      personality_sides?: string[];
      category_ids?: string[];
      latitude?: number;
      longitude?: number;
      radius_km?: number;
      city?: string;
      region?: string;
      with_image?: boolean;
    }) {
      const query: Record<string, unknown> = {};
      if (params?.keyword) query.keyword = params.keyword;
      if (params?.vibes?.length) query.vibe = params.vibes.join(",");
      if (params?.personality_sides?.length) {
        query.personality_sides = params.personality_sides.join(",");
      }
      if (params?.category_ids?.length) {
        query.category_ids = params.category_ids.join(",");
      }
      if (params?.latitude !== undefined && params?.longitude !== undefined) {
        query.latitude = params.latitude;
        query.longitude = params.longitude;
        if (params?.radius_km !== undefined) query.radius_km = params.radius_km;
      }
      if (params?.city) query.city = params.city;
      if (params?.region) query.region = params.region;
      if (params?.with_image) query.with_image = "true";
      return await this.SendRequest<MatchHistogramDAO>({
        method: "get",
        path: "/list-items/match-histogram",
        query: Object.keys(query).length > 0 ? query : undefined,
      });
    }

    async createList(dto: CreateListDTO){
      return await this.SendRequest<ListItemDAO>({
        method:"post",
        path:"/",
        body:dto,
      })
    }

    async uploadListItemImage(file: RNFile, itemId: string) {
      const body = new FormData();
      body.append("image", file as never);
      return await this.SendRequest<{ url: string; id: string }>({
        method: "post",
        path: "/image",
        body: body as never,
        query: { item_id: itemId },
      });
    }

    async deleteListImage(imageId: string) {
      return await this.SendRequest<null>({
        method: "delete",
        path: `/image/${imageId}`,
      });
    }

    async fetchListItems(params?: {
      keyword?: string;
      user_id?: string;
      is_favorite?: boolean;
      scope?: "mine" | "all";
      category_ids?: string[];
      vibes?: string[];
      personality_sides?: string[];
      match_min?: number;
      match_max?: number;
      limit?: number;
      latitude?: number;
      longitude?: number;
      radius_km?: number;
      city?: string;
      region?: string;
      with_image?: boolean;
      /** YYYY-MM-DD inclusive lower bound on pick created_at */
      date_from?: string;
      /** YYYY-MM-DD inclusive upper bound on pick created_at */
      date_to?: string;
    }) {
      const query: {
        keyword?: string;
        user_id?: string;
        is_favorite?: string;
        scope?: "mine" | "all";
        category_ids?: string;
        vibe?: string;
        personality_sides?: string;
        match_min?: number;
        match_max?: number;
        limit?: number;
        latitude?: number;
        longitude?: number;
        radius_km?: number;
        city?: string;
        region?: string;
        with_image?: string;
        date_from?: string;
        date_to?: string;
      } = {};
      if (params?.keyword) query.keyword = params.keyword;
      if (params?.user_id) query.user_id = params.user_id;
      if (params?.is_favorite) query.is_favorite = "true";
      if (params?.scope) query.scope = params.scope;
      if (params?.category_ids?.length) query.category_ids = params.category_ids.join(",");
      if (params?.vibes?.length) query.vibe = params.vibes.join(",");
      if (params?.personality_sides?.length) query.personality_sides = params.personality_sides.join(",");
      if (params?.match_min !== undefined) query.match_min = params.match_min;
      if (params?.match_max !== undefined) query.match_max = params.match_max;
      if (params?.limit !== undefined) query.limit = params.limit;
      if (params?.latitude !== undefined && params?.longitude !== undefined) {
        query.latitude = params.latitude;
        query.longitude = params.longitude;
        if (params?.radius_km !== undefined) query.radius_km = params.radius_km;
      }
      if (params?.city) query.city = params.city;
      if (params?.region) query.region = params.region;
      if (params?.with_image) query.with_image = "true";
      if (params?.date_from) query.date_from = params.date_from;
      if (params?.date_to) query.date_to = params.date_to;
      return await this.SendRequest<ListItemPublic[]>({
        method: "get",
        path: "/list-items",
        query: Object.keys(query).length > 0 ? query : undefined,
      });
    }

    async setListItemFavorite(itemId: string, favorite: boolean) {
      return await this.SendRequest<null>({
        method: favorite ? "post" : "delete",
        path: `/items/${itemId}/favorite`,
      });
    }

    async fetchListItem(itemId: string) {
      return await this.SendRequest<ListItemPublic>({
        method: "get",
        path: `/items/${itemId}`,
      });
    }

    async createListItem(dto: CreateListItemDTO) {
      return await this.SendRequest<Item>({
        method: "post",
        path: "/items",
        body: dto,
      });
    }

    async updateListItem(itemId: string, dto: UpdateListItemDTO) {
      return await this.SendRequest<ListItemPublic>({
        method: "patch",
        path: `/items/${itemId}`,
        body: dto,
      });
    }

    async deleteListItem(itemId: string) {
      return await this.SendRequest<null>({
        method: "delete",
        path: `/items/${itemId}`,
      });
    }


}

export default new ListService()