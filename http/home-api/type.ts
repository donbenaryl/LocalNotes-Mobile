import type { Account, ListItemDAO } from "../list-api/types";

export type activitiesDTO ={
    page:number;
}

export type ActivityListData = ListItemDAO & {
  similarity?: number | null;
};

export type ActivityItemDAO = {
  id: string;
  account: Account;
  entity: "list" | "user";
  action: "create" | "update" | "like" | "save" | "share" | "comment" | "follow";
  data: ActivityListData | { id: string; name: string };
  created_at: string;
};

export type ActivitiesDAO = {
  data: ActivityItemDAO[];
  message: string;
  pagination: {
    next: number | null;
    page: number;
    total: number;
  };
  success: boolean;
};


export interface categoriesItemDAO{
  name:string;
  id:string;
}
export type CategoriesDAO ={
  data: categoriesItemDAO[];
  message: string;
  pagination: {
    next: number | null;
    page: number;
    total: number;
  };
  success: boolean;
}
