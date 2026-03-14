import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { redirect } from "next/navigation"

export const metadata = { title: "Statistiques" }

export default async function StatsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })
  if (!membership) {
    return <div className="p-4 text-[#888]">Acces refuse</div>
  }

  const [totalWords, totalDefs, totalReactions, totalMembers, topContributors, mostReactedWord, bestDefinition] =
    await Promise.all([
      prisma.word.count({ where: { groupId } }),
      prisma.definition.count({ where: { word: { groupId } } }),
      prisma.reaction.count({ where: { word: { groupId } } }),
      prisma.groupMember.count({ where: { groupId } }),
      prisma.user.findMany({
        where: { words: { some: { groupId } } },
        select: {
          id: true,
          username: true,
          avatar: true,
          _count: { select: { words: { where: { groupId } } } },
        },
        orderBy: { words: { _count: "desc" } },
        take: 5,
      }),
      prisma.word.findFirst({
        where: { groupId },
        orderBy: { reactions: { _count: "desc" } },
        select: {
          id: true,
          term: true,
          author: { select: { username: true } },
          _count: { select: { reactions: true } },
        },
      }),
      prisma.definition.findFirst({
        where: { word: { groupId } },
        orderBy: { votes: { _count: "desc" } },
        select: {
          id: true,
          content: true,
          author: { select: { username: true } },
          word: { select: { term: true } },
          _count: { select: { votes: true } },
        },
      }),
    ])

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Statistiques</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard emoji="📝" label="Mots" value={totalWords} />
        <StatCard emoji="📖" label="Definitions" value={totalDefs} />
        <StatCard emoji="🔥" label="Reactions" value={totalReactions} />
        <StatCard emoji="👥" label="Membres" value={totalMembers} />
      </div>

      {/* Top Contributors */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-[#F5F5F5] mb-3">🏆 Top contributeurs</h2>
          {topContributors.length === 0 ? (
            <p className="text-[#888] text-sm">Aucun contributeur</p>
          ) : (
            <div className="space-y-2">
              {topContributors.map((user, i) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#2A2A2E] flex items-center justify-center text-xs font-bold">
                    {user.avatar || user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 text-[#F5F5F5] text-sm">{user.username}</span>
                  <span className="text-[#34D399] font-mono text-sm font-bold">{user._count.words}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Reacted Word */}
      {mostReactedWord && mostReactedWord._count.reactions > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-[#F5F5F5] mb-2">🔥 Mot le plus reactif</h2>
            <p className="font-mono text-lg text-[#34D399]">{mostReactedWord.term}</p>
            <p className="text-xs text-[#888]">
              par {mostReactedWord.author.username} · {mostReactedWord._count.reactions} reactions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Best Definition */}
      {bestDefinition && bestDefinition._count.votes > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-[#F5F5F5] mb-2">👍 Meilleure definition</h2>
            <p className="text-sm text-[#888] mb-1">Pour &quot;{bestDefinition.word.term}&quot;</p>
            <p className="text-[#F5F5F5] text-sm">{bestDefinition.content}</p>
            <p className="text-xs text-[#888] mt-1">
              par {bestDefinition.author.username} · {bestDefinition._count.votes} votes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl mb-1">{emoji}</div>
        <div className="text-2xl font-bold font-mono text-[#F5F5F5]">{value}</div>
        <div className="text-xs text-[#888]">{label}</div>
      </CardContent>
    </Card>
  )
}
