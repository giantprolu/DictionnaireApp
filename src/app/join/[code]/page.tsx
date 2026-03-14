import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { JoinButton } from "@/components/groups/join-button"
import Link from "next/link"

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const group = await prisma.group.findUnique({
    where: { code },
    select: { name: true, emoji: true },
  })
  return {
    title: group ? `Rejoindre ${group.name}` : "Invitation",
    description: group ? `Rejoins le groupe ${group.emoji} ${group.name} sur Val'tionnaire` : undefined,
  }
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const session = await auth()

  const group = await prisma.group.findUnique({
    where: { code },
    select: {
      id: true,
      name: true,
      emoji: true,
      description: true,
      _count: { select: { members: true, words: true } },
    },
  })

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🤷</div>
            <h1 className="text-xl font-bold text-[#F5F5F5] mb-2">Groupe introuvable</h1>
            <p className="text-[#888] text-sm mb-6">Ce code d&apos;invitation n&apos;existe pas ou a expire.</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2.5 bg-[#34D399] text-[#0A0A0B] rounded-xl font-semibold text-sm hover:bg-[#34D399]/90 transition-colors"
            >
              Retour
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">{group.emoji || "📖"}</div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] mb-1">{group.name}</h1>
          {group.description && (
            <p className="text-[#888] text-sm mb-4">{group.description}</p>
          )}
          <div className="flex justify-center gap-4 text-sm text-[#888] mb-6">
            <span>{group._count.members} membre{group._count.members > 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{group._count.words} mot{group._count.words > 1 ? "s" : ""}</span>
          </div>

          {session?.user ? (
            <JoinButton code={code} groupId={group.id} />
          ) : (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/join/${code}`)}`}
              className="inline-block w-full px-6 py-3 bg-[#34D399] text-[#0A0A0B] rounded-xl font-semibold text-sm hover:bg-[#34D399]/90 transition-colors"
            >
              Se connecter pour rejoindre
            </Link>
          )}

          <p className="text-xs text-[#888] mt-4">
            <Link href="/" className="hover:text-[#34D399]">Val&apos;tionnaire</Link> — Le dico de ta bande de potes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
