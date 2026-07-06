export interface similarCreatorItem {
  id: string;
  name: string;
  profile_image: string;
  account_type: string;
  followers_count: number;
  is_followed: boolean;
  num_lists:number;
  follows_summary:string;
}

export interface similarUserScore{
  personal_similarity:number;
  taste_similarity:number;
  location_similarity:number;
  overall_similarity:number;
  reason:{
    overall_score:number;
    reasons:[]
  };
  last_calculated:Date;
}