import { AppHttpService } from "..";
import type { RNFile } from "../types";
import type { CreateListDTO, serchDTO, ListItemDAO, listDTO, Category, userListDTO, listedDTO, Comment, ListItemPublic, CreateListItemDTO, UpdateListItemDTO, Item } from "./types";

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
    async createListComment(listId:string, dto:{content:string}, parent?: string){
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
      return await this.SendRequest<ListItemDAO[]>({
        method:"get",
        path:"/unified-search",
        query:dto,
      })
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
      category_ids?: string[];
    }) {
      const query: {
        keyword?: string;
        user_id?: string;
        is_favorite?: string;
        category_ids?: string;
      } = {};
      if (params?.keyword) query.keyword = params.keyword;
      if (params?.user_id) query.user_id = params.user_id;
      if (params?.is_favorite) query.is_favorite = "true";
      if (params?.category_ids?.length) query.category_ids = params.category_ids.join(",");
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