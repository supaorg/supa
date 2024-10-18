export type SpacePointer = {
  id: string;
  /**
   * uri starts with 'file://' for a local space or 'https://' for a remote space
   */
  uri: string;
  name: string | null;
  createdAt: Date;
}