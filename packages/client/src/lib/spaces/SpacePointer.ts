export type SpacePointer = {
  id: string;
  uri: string;
  name: string | null;
  createdAt: Date;
  userId: string | null; // null for spaces created before user authentication
}