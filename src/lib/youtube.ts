// Extrai o ID de um vídeo do YouTube a partir de vários formatos de link possíveis:
// https://youtu.be/ID, https://www.youtube.com/watch?v=ID, .../shorts/ID, .../embed/ID
export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}
