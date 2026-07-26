import { AppHttpService } from "..";
import type { SpotlightEditionDAO, SpotlightEditionDQO } from "./type";

class SpotlightService extends AppHttpService {
  constructor() {
    super({
      baseURL: "/spotlight",
    });
  }

  async fetchEdition(query?: SpotlightEditionDQO) {
    return await this.SendRequest<SpotlightEditionDAO | null, unknown, SpotlightEditionDQO>({
      method: "get",
      path: "/edition",
      query: query && Object.keys(query).length > 0 ? query : undefined,
    });
  }

  // Event-logging quartet (plan.md §1.9/§3.13) — fire-and-forget engagement
  // signals feeding §1.5's scoring pipeline. Errors are logged, not thrown:
  // a failed impression/open/save/cta-click log should never interrupt the
  // interaction that triggered it.
  async logImpression(spotlightItemId: string): Promise<void> {
    const { error } = await this.SendRequest<null>({
      method: "post",
      path: `/items/${spotlightItemId}/impression`,
    });
    if (error) console.error("Failed to log Spotlight impression:", error);
  }

  async logOpenEvent(spotlightItemId: string): Promise<void> {
    const { error } = await this.SendRequest<null>({
      method: "post",
      path: `/items/${spotlightItemId}/open`,
    });
    if (error) console.error("Failed to log Spotlight open event:", error);
  }

  async logSaveEvent(spotlightItemId: string): Promise<void> {
    const { error } = await this.SendRequest<null>({
      method: "post",
      path: `/items/${spotlightItemId}/save`,
    });
    if (error) console.error("Failed to log Spotlight save event:", error);
  }

  async logCtaClickEvent(spotlightItemId: string): Promise<void> {
    const { error } = await this.SendRequest<null>({
      method: "post",
      path: `/items/${spotlightItemId}/cta-click`,
    });
    if (error) console.error("Failed to log Spotlight CTA-click event:", error);
  }
}

export default new SpotlightService();
