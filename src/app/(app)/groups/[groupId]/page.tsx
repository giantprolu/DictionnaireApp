import Link from "next/link"
import { getGroup } from "@/lib/actions/groups"
import { getGroupWords, getWordOfTheDay } from "@/lib/actions/words"
import { Card, CardContent } from "@/components/ui/card"
import { WordListClient } from "@/components/words/word-list-client"

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const result = await getGroup(groupId)
  return { title: result.success ? result.data?.name : "Groupe" }
}

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const [groupResult, wordsResult, wotdResult] = await Promise.all([
    getGroup(groupId),
    getGroupWords(groupId, {}),
    getWordOfTheDay(groupId),
  ])

  if (!groupResult.success || !groupResult.data) {
    return (
      <div className="p-4 text-center py-20">
        <div className="text-4xl mb-4">🔒</div>
        <p className="text-[#888]">{groupResult.error || "Groupe introuvable"}</p>
      </div>
    )
  }

  const group = groupResult.data
  const wordsData = wordsResult.success ? wordsResult.data : null
  const words = wordsData?.words ?? []
  const wotd = wotdResult.success ? wotdResult.data : null

  return (
    <div className="space-y-4 p-4">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{group.emoji || "📖"}</span>
          <div>
            <h1 className="text-xl font-bold text-[#F5F5F5]">{group.name}</h1>
            <p className="text-sm text-[#888]">
              {group.memberCount || 0} membres
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/groups/${groupId}/members`} className="p-2 rounded-lg hover:bg-[#1C1C1F] transition-colors">
            <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <Link href={`/groups/${groupId}/stats`} className="p-2 rounded-lg hover:bg-[#1C1C1F] transition-colors">
            <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Link>
          <Link href={`/groups/${groupId}/settings`} className="p-2 rounded-lg hover:bg-[#1C1C1F] transition-colors">
            <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Word of the Day */}
      {wotd && (
        <Link href={`/groups/${groupId}/words/${wotd.id}`}>
          <Card className="bg-gradient-to-r from-[#34D399]/10 to-[#A78BFA]/10 border-[#34D399]/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#34D399] uppercase tracking-wider">Mot du jour</span>
              </div>
              <p className="text-xl font-mono font-bold text-[#F5F5F5]">{wotd.term}</p>
              {wotd.definition && (
                <p className="text-sm text-[#888] mt-1 line-clamp-2">{wotd.definition.content}</p>
              )}
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Word List with Search/Filter */}
      <WordListClient groupId={groupId} initialWords={words} />

      {/* FAB - Add Word */}
      <Link
        href={`/groups/${groupId}/words/new`}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#34D399] rounded-full flex items-center justify-center shadow-lg shadow-[#34D399]/25 hover:bg-[#34D399]/90 transition-colors z-40"
      >
        <svg className="w-7 h-7 text-[#0A0A0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
    </div>
  )
}
