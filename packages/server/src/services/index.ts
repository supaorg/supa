import { Database } from '../database';
import { AuthService } from '../auth';
import { SpaceService } from './space.service';

export interface Services {
  auth: AuthService;
  spaces: SpaceService;
}

export function createServices(db: Database): Services {
  return {
    auth: new AuthService(db),
    spaces: new SpaceService(db)
  };
}

export * from './space.service'; 