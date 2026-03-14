import { getWord } from "@/lib/actions/words"
import { auth } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReactionBar } from "@/components/reactions/reaction-bar"
import { DefinitionList } from "@/components/definitions/definition-list"
import { AddDefinitionForm } from "@/components/definitions/add-definition-form"
import { CommentSection } from "@/components/comments/comment-section"
import { WordActions } from "@/components/words/word-actions"
import { formatDate } from "@/lib/utils"

export async function generateMetadata({ params }: { params: Promise<{ wordId: string }> }) {
  const { wordId } = await params
  const result = await getWord(wordId)
  return {
    title: result.success ? result.data?.term : "Mot",
  }
}

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; wordId: string }>
}) {
  const { groupId, wordId } = await params
  const [result, session] = await Promise.all([getWord(wordId), auth()])

  if (!result.success || !result.data) {
    return (
      <div className="p-4 text-center py-20">
        <div className="text-4xl mb-4">🤷</div>
        <p className="text-[#888]">{result.error || "Mot introuvable"}</p>
      </div>
    )
  }

  const word = result.data
  const currentUserId = session?.user?.id || ""

  // Flatten aggregated reactions for ReactionBar
  const flatReactions: { emoji: string; userId: string }[] = []
  for (const r of word.reactions) {
    for (const uid of r.userIds) {
      flatReactions.push({ emoji: r.emoji, userId: uid })
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Word Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold text-[#F5F5F5]">{word.term}</h1>
              {word.phonetic && (
                <p className="text-sm font-mono text-[#888] mt-1">{word.phonetic}</p>
              )}
            </div>
            {word.author.id === currentUserId && <WordActions wordId={word.id} groupId={groupId} />}
          </div>

          {word.isNSFW && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded">
              NSFW
            </span>
          )}

          {word.origin && (
            <div className="mt-3 px-3 py-2 bg-[#0A0A0B] rounded-lg">
              <p className="text-xs text-[#888] mb-0.5">Origine</p>
              <p className="text-sm text-[#F5F5F5] italic">{word.origin}</p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 text-xs text-[#888]">
            <span>Ajoute par <strong className="text-[#F5F5F5]">{word.author.username}</strong></span>
            <span>·</span>
            <span>{formatDate(word.createdAt)}</span>
          </div>

          {/* Tags */}
          {word.tags.length > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {word.tags.map((tag) => (
                <Badge key={tag.id} color={tag.color || "#6B7280"}>{tag.name}</Badge>
              ))}
            </div>
          )}

          {/* Reactions */}
          <div className="mt-4">
            <ReactionBar
              wordId={word.id}
              reactions={flatReactions}
              currentUserId={currentUserId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Definitions */}
      <div>
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-3">
          Definitions ({word.definitions.length})
        </h2>
        <DefinitionList
          definitions={word.definitions}
          currentUserId={currentUserId}
        />
        <div className="mt-3">
          <AddDefinitionForm wordId={word.id} />
        </div>
      </div>

      {/* Comments */}
      <div>
        <h2 className="text-lg font-semibold text-[#F5F5F5] mb-3">
          Commentaires ({word.comments.length})
        </h2>
        <CommentSection
          wordId={word.id}
          comments={word.comments}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  )
}
