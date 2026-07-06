export interface AdminUserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  account_type: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  profile_image_url: string;
}

export interface BulkDeleteDTO {
  user_ids: string[];
}
