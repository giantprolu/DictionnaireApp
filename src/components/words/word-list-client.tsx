"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getGroupWords, getRandomWord } from "@/lib/actions/words"

interface WordData {
  id: string
  term: string
  phonetic?: string | null
  isNSFW: boolean
  createdAt: string | Date
  author: { id: string; username: string; avatar?: string | null }
  definitionCount: number
  reactionCount: number
  tags: { id: string; name: string; color?: string | null }[]
}

interface Props {
  groupId: string
  initialWords: unknown[]
}

const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Ancien" },
  { value: "alpha-asc", label: "A-Z" },
  { value: "alpha-desc", label: "Z-A" },
  { value: "popular", label: "Populaire" },
]

export function WordListClient({ groupId, initialWords }: Props) {
  const [words, setWords] = useState<WordData[]>(initialWords as WordData[])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("recent")
  const [loading, setLoading] = useState(false)
  const [randomWord, setRandomWord] = useState<WordData | null>(null)

  const fetchWords = useCallback(async () => {
    setLoading(true)
    const result = await getGroupWords(groupId, { search, sort })
    if (result.success && result.data) {
      setWords(result.data.words as unknown as WordData[])
    }
    setLoading(false)
  }, [groupId, search, sort])

  useEffect(() => {
    const timer = setTimeout(fetchWords, 300)
    return () => clearTimeout(timer)
  }, [fetchWords])

  async function handleRandomWord() {
    const result = await getRandomWord(groupId)
    if (result.success && result.data) {
      setRandomWord(result.data as unknown as WordData)
      setTimeout(() => setRandomWord(null), 5000)
    }
  }

  return (
    <div className="space-y-3">
      {/* Random Word Modal */}
      {randomWord && (
        <Card className="bg-gradient-to-r from-[#A78BFA]/10 to-[#34D399]/10 border-[#A78BFA]/20 animate-pulse">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-[#A78BFA] font-semibold uppercase tracking-wider mb-1">Mot aleatoire</p>
            <Link href={`/groups/${groupId}/words/${randomWord.id}`}>
              <p className="text-2xl font-mono font-bold text-[#F5F5F5] hover:text-[#34D399] transition-colors">
                {randomWord.term}
              </p>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Search + Sort Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Chercher un mot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] text-[#F5F5F5] placeholder-[#888] text-sm focus:outline-none focus:ring-2 focus:ring-[#34D399]"
          />
        </div>
        <button
          onClick={handleRandomWord}
          className="px-3 rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] text-xl hover:bg-[#2A2A2E] transition-colors"
          title="Mot aleatoire"
        >
          🎲
        </button>
      </div>

      {/* Sort Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSort(option.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sort === option.value
                ? "bg-[#34D399] text-[#0A0A0B]"
                : "bg-[#1C1C1F] text-[#888] hover:text-[#F5F5F5]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Word List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#1C1C1F] animate-pulse" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🫠</div>
          <p className="text-[#888]">
            {search ? "Aucun mot trouve" : "Aucun mot encore... Ajoute le premier !"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {words.map((word) => (
            <Link key={word.id} href={`/groups/${groupId}/words/${word.id}`}>
              <Card className="hover:border-[#34D399]/20 transition-all hover:translate-x-1">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono font-bold text-[#F5F5F5] truncate">{word.term}</h3>
                        {word.isNSFW && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">NSFW</span>
                        )}
                      </div>
                      {word.phonetic && (
                        <p className="text-xs text-[#888] font-mono">{word.phonetic}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[#888]">
                        <span>par {word.author.username}</span>
                        <span>·</span>
                        <span>{word.definitionCount} def{word.definitionCount > 1 ? "s" : ""}</span>
                        {word.reactionCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{word.reactionCount} reactions</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {word.tags && word.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {word.tags.map((tag) => (
                        <Badge key={tag.id} color={tag.color || "#6B7280"}>
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
