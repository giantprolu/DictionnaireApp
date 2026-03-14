"use client"

import { useState, useOptimistic } from "react"
import { vote } from "@/lib/actions/votes"
import { deleteDefinition } from "@/lib/actions/definitions"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface DefinitionData {
  id: string
  content: string
  example: string | null
  isOriginal: boolean
  createdAt: string | Date
  author: { id: string; username: string; avatar: string | null }
  votes: { userId: string; value: number }[]
  voteScore?: number
}

interface Props {
  definitions: DefinitionData[]
  currentUserId: string
}

export function DefinitionList({ definitions, currentUserId }: Props) {
  const sorted = [...definitions].sort((a, b) => {
    const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0)
    const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0)
    return scoreB - scoreA
  })

  return (
    <div className="space-y-2">
      {sorted.map((def, i) => (
        <DefinitionCard key={def.id} definition={def} index={i} currentUserId={currentUserId} />
      ))}
    </div>
  )
}

function DefinitionCard({
  definition,
  index,
  currentUserId,
}: {
  definition: DefinitionData
  index: number
  currentUserId: string
}) {
  const [deleting, setDeleting] = useState(false)

  const [optimisticVotes, addOptimisticVote] = useOptimistic(
    definition.votes,
    (state: { userId: string; value: number }[], newValue: number) => {
      const existing = state.find((v) => v.userId === currentUserId)
      if (existing) {
        if (existing.value === newValue) {
          return state.filter((v) => v.userId !== currentUserId)
        }
        return state.map((v) => (v.userId === currentUserId ? { ...v, value: newValue } : v))
      }
      return [...state, { userId: currentUserId, value: newValue }]
    }
  )

  const score = optimisticVotes.reduce((sum, v) => sum + v.value, 0)
  const userVote = optimisticVotes.find((v) => v.userId === currentUserId)

  async function handleVote(value: number) {
    addOptimisticVote(value)
    await vote(definition.id, value)
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette definition ?")) return
    setDeleting(true)
    await deleteDefinition(definition.id)
  }

  const isAuthor = definition.author.id === currentUserId

  return (
    <Card className={index === 0 ? "border-[#34D399]/20" : ""}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
            <button
              onClick={() => handleVote(1)}
              className={`p-1 rounded transition-colors ${
                userVote?.value === 1 ? "text-[#34D399]" : "text-[#888] hover:text-[#F5F5F5]"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-sm font-mono font-bold ${
              score > 0 ? "text-[#34D399]" : score < 0 ? "text-red-400" : "text-[#888]"
            }`}>
              {score}
            </span>
            <button
              onClick={() => handleVote(-1)}
              className={`p-1 rounded transition-colors ${
                userVote?.value === -1 ? "text-red-400" : "text-[#888] hover:text-[#F5F5F5]"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[#F5F5F5] text-sm">{definition.content}</p>
              {definition.isOriginal && index === 0 && (
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-[#A78BFA]/20 text-[#A78BFA] rounded">
                  ORIGINALE
                </span>
              )}
            </div>

            {definition.example && (
              <p className="text-xs text-[#888] italic mt-2 pl-3 border-l-2 border-[#2A2A2E]">
                &quot;{definition.example}&quot;
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-xs text-[#888]">
              <span>par {definition.author.username}</span>
              <span>·</span>
              <span>{formatDate(definition.createdAt)}</span>
              {isAuthor && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-400/60 hover:text-red-400 transition-colors ml-auto"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
