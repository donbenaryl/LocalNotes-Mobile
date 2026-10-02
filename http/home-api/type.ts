import type { Account, ListItemDAO, ListItemPublic } from "../list-api/types";

export type activitiesDTO ={
    page:number;
}

export type ActivityListData = ListItemDAO & {
  similarity?: number | null;
};

export type ActivityPickData = ListItemPublic & {
  name: string;
};

export type ActivityStoredData = { id: string; name: string };

export type ActivityItemDAO = {
  id: string;
  account: Account;
  entity: "list" | "user" | "list_item";
  action: "create" | "update" | "like" | "save" | "share" | "comment" | "follow";
  data: ActivityListData | ActivityPickData | ActivityStoredData;
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
