import { getGroupMembers } from "@/lib/actions/groups"
import { auth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { MemberActions } from "@/components/groups/member-actions"
import { getInitials } from "@/lib/utils"

export const metadata = { title: "Membres" }

export default async function MembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const [result, session] = await Promise.all([getGroupMembers(groupId), auth()])

  if (!result.success) {
    return <div className="p-4 text-[#888]">{result.error}</div>
  }

  const members = result.data || []
  const currentUserId = session?.user?.id

  const isCurrentUserAdmin = members.some(
    (m) => m.userId === currentUserId && m.role === "ADMIN"
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Membres</h1>
        <span className="text-[#888] text-sm">{members.length} membre{members.length > 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2A2A2E] flex items-center justify-center text-sm font-bold text-[#F5F5F5]">
                {member.avatar || getInitials(member.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#F5F5F5] truncate">{member.username}</span>
                  {member.role === "ADMIN" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#A78BFA]/20 text-[#A78BFA] rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#888]">
                  Membre depuis {new Date(member.joinedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {isCurrentUserAdmin && member.userId !== currentUserId && (
                <MemberActions groupId={groupId} userId={member.userId} currentRole={member.role as "ADMIN" | "MEMBER"} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
