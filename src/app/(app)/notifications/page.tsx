import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export const metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [recentReactions, recentDefinitions, achievements] = await Promise.all([
    prisma.reaction.findMany({
      where: { word: { authorId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        emoji: true,
        createdAt: true,
        user: { select: { username: true } },
        word: { select: { id: true, term: true, groupId: true } },
      },
    }),
    prisma.definition.findMany({
      where: { word: { authorId: session.user.id }, isOriginal: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        author: { select: { username: true } },
        word: { select: { id: true, term: true, groupId: true } },
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
      take: 5,
      select: {
        id: true,
        unlockedAt: true,
        achievement: { select: { name: true, emoji: true } },
      },
    }),
  ])

  type NotifItem = {
    id: string
    type: "reaction" | "definition" | "achievement"
    text: string
    date: Date
    link?: string
  }

  const notifications: NotifItem[] = [
    ...recentReactions.map((r) => ({
      id: `r-${r.id}`,
      type: "reaction" as const,
      text: `${r.user.username} a reagi ${r.emoji} a ton mot "${r.word?.term}"`,
      date: r.createdAt,
      link: r.word ? `/groups/${r.word.groupId}/words/${r.word.id}` : undefined,
    })),
    ...recentDefinitions.map((d) => ({
      id: `d-${d.id}`,
      type: "definition" as const,
      text: `${d.author.username} a propose une definition pour "${d.word.term}"`,
      date: d.createdAt,
      link: `/groups/${d.word.groupId}/words/${d.word.id}`,
    })),
    ...achievements.map((a) => ({
      id: `a-${a.id}`,
      type: "achievement" as const,
      text: `Tu as debloque le badge ${a.achievement.emoji} ${a.achievement.name} !`,
      date: a.unlockedAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-[#888]">Rien de neuf pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const content = (
              <Card key={notif.id} className={notif.type === "achievement" ? "border-[#A78BFA]/20" : ""}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1F] flex items-center justify-center text-sm shrink-0">
                    {notif.type === "reaction" ? "🔥" : notif.type === "definition" ? "📝" : "🏆"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#F5F5F5]">{notif.text}</p>
                    <p className="text-[10px] text-[#888] mt-0.5">{formatDate(notif.date)}</p>
                  </div>
                </CardContent>
              </Card>
            )

            return notif.link ? (
              <Link key={notif.id} href={notif.link}>{content}</Link>
            ) : (
              <div key={notif.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
