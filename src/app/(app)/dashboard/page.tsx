import Link from "next/link"
import { getMyGroups } from "@/lib/actions/groups"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const result = await getMyGroups()
  const groups = result.success ? result.data ?? [] : []

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Mes groupes</h1>
        <div className="flex gap-2">
          <Link href="/groups/join">
            <Button variant="outline" size="sm">Rejoindre</Button>
          </Link>
          <Link href="/groups/new">
            <Button size="sm">+ Creer</Button>
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-xl font-semibold text-[#F5F5F5] mb-2">
            Aucun groupe pour l&apos;instant
          </h2>
          <p className="text-[#888] mb-6 max-w-xs">
            C&apos;est vide comme le vocabulaire de Kevin
          </p>
          <div className="flex gap-3">
            <Link href="/groups/new">
              <Button>Creer un groupe</Button>
            </Link>
            <Link href="/groups/join">
              <Button variant="outline">Rejoindre</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="hover:border-[#34D399]/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{group.emoji || "📖"}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#F5F5F5] truncate">
                        {group.name}
                      </h3>
                      <div className="flex gap-3 text-sm text-[#888]">
                        <span>{group.memberCount} membres</span>
                        <span>{group.wordCount} mots</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Link href="/groups/new">
            <Card className="border-dashed border-[#2A2A2E] hover:border-[#34D399]/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-center gap-2 text-[#888]">
                <span className="text-2xl">+</span>
                <span>Creer un nouveau groupe</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  )
}
