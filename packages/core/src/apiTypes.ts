import type { VertexOperation } from './index';

export interface SpaceCreationResponse {
  id: string;
  created_at: number;
  owner_id: string;
  operations: ReadonlyArray<VertexOperation>;
  secrets: Record<string, string>;
}