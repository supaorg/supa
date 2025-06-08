const removeDashes = (guid: string) => guid.replace(/-/g, '');

export default function uuid(): string {
  return removeDashes(crypto.randomUUID());
}