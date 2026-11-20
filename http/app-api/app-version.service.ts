import { PublicHttpService } from '..';
import type { MobileVersionConfigDAO } from './types';

class AppVersionService extends PublicHttpService {
  constructor() {
    super({
      baseURL: '/mobile',
    });
  }

  async getVersionConfig() {
    return await this.SendRequest<MobileVersionConfigDAO>({
      method: 'get',
      path: '/version',
    });
  }
}

export const appVersionService = new AppVersionService();
