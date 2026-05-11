/* IDs de vídeos do YouTube usados nas tarefas de mineração. */
export const YOUTUBE_IDS = [
  'dQw4w9WgXcQ', 'aqz-KE-bpKQ', 'ysz5S6PUM-U', 'jNQXAC9IVRw',
  '3JZ_D3ELwOQ', 'LXb3EKWsInQ', 'e-ORhEE9VVg', 'kXYiU_JCYtU',
  'fJ9rUzIMcZQ', 'hT_nvWreIhg', '09R8_2nJtjg', 'CevxZvSJLk8',
  'pRpeEdMmmQ0', 'YVkUvmDQ3HY', 'SlPhMPnQ58k', 'JGwWNGJdvx8',
  '2Vv-BfVoq4g', 'OPf0YbXqDm0', 'RgKAFK5djSk', '7wtfhZwyrcc',
  '60ItHLz5WEA', 'kJQP7kiw5Fk', '3AtDnEC4zak', '9bZkp7q19f0',
  'rYEDA3JcQqw', 'uelHwf8o7_U', 'lp-EO5I60KA', 'tVj0ZTS4WF4',
  'oRdxUFDoQe0', 'Pkh8UtuejGw', 'L_jWHffIx5E', 'pt8VYOfr8To',
  'bo_efYhYU2A', 'CleUrIiOqs0', 'rfscVS0vtbw', 'hLQl3WQQoQ0',
  'JRfuAukYTKg', 'HP-MbfHFUqs', 'fLexgOxsZu0', 'YQHsXMglC9A',
] as const

/* Hash determinístico simples — mesma entrada sempre gera o mesmo índice. */
export const getVideoIdForSlot = (userId: number, slotIndex: number): string => {
  const seed = (Math.abs(Number(userId) || 1) * 1009 + slotIndex * 31) % YOUTUBE_IDS.length
  return YOUTUBE_IDS[seed]
}

export const getYouTubeThumbnail = (videoId: string): string =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

/* Cache em memória de títulos já buscados via oEmbed (evita refazer fetch) */
const titleCache = new Map<string, string>()

export const fetchYouTubeTitle = async (videoId: string, signal?: AbortSignal): Promise<string> => {
  if (titleCache.has(videoId)) return titleCache.get(videoId) as string
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(url, { signal })
    if (!res.ok) return ''
    const data = (await res.json()) as { title?: string }
    const title = String(data?.title ?? '').trim()
    if (title) titleCache.set(videoId, title)
    return title
  } catch {
    return ''
  }
}
