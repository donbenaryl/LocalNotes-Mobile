/** React Native file object for multipart uploads. */
export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export type ViewSource = "web" | "mobile";

export type ViewOrigin =
  | "search"
  | "spotlight"
  | "discovery"
  | "profile"
  | "notification"
  | "share_link"
  | "smart_pick"
  | "recommendation"
  | "other";

export interface ViewTrackingDTO {
  source: ViewSource;
  origin: ViewOrigin;
  origin_other?: string;
}
