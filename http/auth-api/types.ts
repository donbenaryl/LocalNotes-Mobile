export type signUpDTO={
    email:string;
    notification_token?: string;
}

export type signInDTO={
    email:string;
    password:string;
}

export type resetDTO={
  email:string;
  otp_code:string;
new_password:string;
}

export type resetDAO={
message:string;
success:boolean;
data:null;
}
export interface verifyDTO{
  email:string;
  otp_code:string;
}
export type signInDAO ={
    id?: string;
    name:string;
    email:string;
    account_type:string;
    website?:string;
    followers_count:number;
    followed_count:number;
    total_likes:number;
    token:string;
    refresh_token?: string;
    has_completed_walkthrough: boolean;
    profile_image_url:string;
    personality_name?: string | null;
    personality_color?: Record<string, number> | null;
    created_at?: string;
}
