// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/hooks.ts — data for the Voyage Journal "book"
//
// useVoyageBook(voyageId) fetches the voyage row, its daily_logs, and its photos
// (as signed URLs for on-screen <img>), then maps them into the read-only Book
// model. Photos use signed URLs via the shared photoStorage helper — lighter than
// the PDF export's data-URL embedding, which we don't need on screen.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getSignedUrls } from '@/lib/photoStorage'
import { buildBook, type Book, type PhotoInput, type VoyageInput, type DailyLogInput } from './mapping'

const DAILY_COLS = 'day_number, date, port, weather, rating, highlights, best_moment, activity, entertainment, breakfast, lunch, dinner, drink'
const VOYAGE_COLS = 'id, ship_name, destination, cruise_line, departure_date, return_date, cover_photo_url'

export function useVoyageBook(voyageId: string | null | undefined) {
  return useQuery<Book>({
    queryKey: ['voyage-book', voyageId],
    enabled: !!voyageId,
    staleTime: 60_000,
    queryFn: async (): Promise<Book> => {
      const vid = voyageId as string

      const [voyageRes, logsRes, photosRes, userRes] = await Promise.all([
        supabase.from('voyages').select(VOYAGE_COLS).eq('id', vid).maybeSingle(),
        supabase.from('daily_logs').select(DAILY_COLS).eq('voyage_id', vid),
        supabase.from('photos').select('day_number, storage_path, caption, created_at').eq('voyage_id', vid).order('created_at', { ascending: true }),
        supabase.auth.getUser(),
      ])
      if (voyageRes.error) throw voyageRes.error
      const voyage = voyageRes.data as VoyageInput | null
      if (!voyage) throw new Error('Voyage not found')

      const logs = (logsRes.data ?? []) as DailyLogInput[]

      // Resolve signed URLs for all photo paths in one batch, then shape for mapping.
      const rawPhotos = (photosRes.data ?? []) as { day_number: number | null; storage_path: string; caption: string | null }[]
      const urlMap = rawPhotos.length ? await getSignedUrls(rawPhotos.map(p => p.storage_path)) : {}
      const photos: PhotoInput[] = rawPhotos
        .map(p => ({ day_number: p.day_number, url: urlMap[p.storage_path] || '', caption: p.caption }))
        .filter(p => p.url)

      // Owner name for the "this journal belongs to" line.
      const uid = userRes.data.user?.id
      let owner = ''
      if (uid) {
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', uid).maybeSingle()
        owner = (profile?.display_name as string) || ''
      }

      return buildBook(voyage, logs, photos, owner)
    },
  })
}
