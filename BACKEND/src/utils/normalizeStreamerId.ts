// src/utils/normalizeStreamerId.ts
export function normalizeStreamerId(id: any): string {
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && "id_streamer" in id) {
    return (id as any).id_streamer;
  }
  return String(id);
}
