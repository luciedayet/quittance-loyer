export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/thumbs/svg?seed=${encodeURIComponent(seed)}`
}
