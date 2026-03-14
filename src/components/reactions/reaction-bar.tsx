"use client"

import { useState, useOptimistic } from "react"
import { toggleReaction } from "@/lib/actions/reactions"

const EMOJI_LIST = ["👍", "😂", "🤔", "❤️", "🔥", "💀", "🤡", "💯"]

interface Props {
  wordId?: string
  definitionId?: string
  reactions: { emoji: string; userId: string }[]
  currentUserId: string
}

interface ReactionGroup {
  emoji: string
  count: number
  hasReacted: boolean
}

function groupReactions(reactions: { emoji: string; userId: string }[], currentUserId: string): ReactionGroup[] {
  const map = new Map<string, { count: number; hasReacted: boolean }>()
  for (const r of reactions) {
    const existing = map.get(r.emoji) || { count: 0, hasReacted: false }
    existing.count++
    if (r.userId === currentUserId) existing.hasReacted = true
    map.set(r.emoji, existing)
  }
  return EMOJI_LIST.map((emoji) => ({
    emoji,
    count: map.get(emoji)?.count || 0,
    hasReacted: map.get(emoji)?.hasReacted || false,
  }))
}

export function ReactionBar({ wordId, definitionId, reactions, currentUserId }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [optimisticReactions, addOptimisticReaction] = useOptimistic(
    reactions,
    (state: { emoji: string; userId: string }[], newEmoji: string) => {
      const existing = state.find((r) => r.emoji === newEmoji && r.userId === currentUserId)
      if (existing) {
        return state.filter((r) => !(r.emoji === newEmoji && r.userId === currentUserId))
      }
      return [...state, { emoji: newEmoji, userId: currentUserId }]
    }
  )

  const grouped = groupReactions(optimisticReactions, currentUserId)
  const activeReactions = grouped.filter((g) => g.count > 0)
  const displayReactions = showAll ? grouped : activeReactions.length > 0 ? activeReactions : grouped.slice(0, 4)

  async function handleToggle(emoji: string) {
    addOptimisticReaction(emoji)
    await toggleReaction(emoji, wordId, definitionId)
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {displayReactions.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => handleToggle(emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all active:scale-90 ${
            hasReacted
              ? "bg-[#34D399]/20 border border-[#34D399]/30"
              : "bg-[#1C1C1F] border border-[#2A2A2E] hover:border-[#888]"
          }`}
        >
          <span className={hasReacted ? "scale-110" : ""}>{emoji}</span>
          {count > 0 && <span className="text-xs text-[#888]">{count}</span>}
        </button>
      ))}
      {!showAll && activeReactions.length > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="px-2 py-1 rounded-full text-xs text-[#888] bg-[#1C1C1F] border border-[#2A2A2E] hover:text-[#F5F5F5]"
        >
          +
        </button>
      )}
    </div>
  )
}
