// features/posts/usePhotoReactions.ts — Fetch and toggle emoji reactions on a photo

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

export const REACTION_TYPES = [
  { emoji: '🚢', label: 'Amazing Cruise'    },
  { emoji: '🌊', label: 'Wish I Was There'  },
  { emoji: '📸', label: 'Great Shot'        },
  { emoji: '🍹', label: 'Looks Fun'         },
  { emoji: '❤️', label: 'Favourite Memory'  },
] as const

export type ReactionEmoji = typeof REACTION_TYPES[number]['emoji']

export interface ReactionSummary {
  emoji:       ReactionEmoji
  label:       string
  count:       number
  userReacted: boolean
}

interface RawRow { emoji: string; user_id: string }

export function usePhotoReactions(photoPath: string) {
  const userId      = useUserId()
  const queryClient = useQueryClient()
  const qk          = ['photo-reactions', photoPath] as const

  const { data = [] } = useQuery<RawRow[]>({
    queryKey: qk,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('photo_reactions')
        .select('emoji, user_id')
        .eq('photo_path', photoPath)
      if (error) throw error
      return (data ?? []) as RawRow[]
    },
    enabled: !!photoPath,
    staleTime: 30_000,
  })

  const reactions = useMemo<ReactionSummary[]>(() =>
    REACTION_TYPES.map(r => ({
      emoji:       r.emoji,
      label:       r.label,
      count:       data.filter(d => d.emoji === r.emoji).length,
      userReacted: data.some(d => d.emoji === r.emoji && d.user_id === userId),
    })),
    [data, userId]
  )

  const { mutate: toggle, isPending } = useMutation({
    mutationFn: async ({ emoji, postId }: { emoji: string; postId: string }) => {
      if (!userId) return
      const already = reactions.find(r => r.emoji === emoji)?.userReacted
      if (already) {
        const { error } = await supabase
          .from('photo_reactions')
          .delete()
          .eq('user_id', userId)
          .eq('photo_path', photoPath)
          .eq('emoji', emoji)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('photo_reactions')
          .insert({ user_id: userId, post_id: postId, photo_path: photoPath, emoji })
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  })

  return { reactions, toggle, isPending }
}
