"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addComment, deleteComment } from "@/lib/actions/comments"
import { formatDate, getInitials } from "@/lib/utils"

interface CommentData {
  id: string
  content: string
  createdAt: string | Date
  parentId: string | null
  author: { id: string; username: string; avatar: string | null }
  replies?: {
    id: string
    content: string
    createdAt: string | Date
    author: { id: string; username: string; avatar: string | null }
  }[]
}

interface Props {
  wordId: string
  comments: CommentData[]
  currentUserId: string
}

export function CommentSection({ wordId, comments, currentUserId }: Props) {
  const [loading, setLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, parentId?: string) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    if (parentId) formData.set("parentId", parentId)

    const result = await addComment(wordId, formData)
    if (result.success) {
      e.currentTarget.reset()
      setReplyTo(null)
    }
    setLoading(false)
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Supprimer ce commentaire ?")) return
    await deleteComment(commentId)
  }

  const topLevelComments = comments.filter((c) => !c.parentId)

  return (
    <div className="space-y-3">
      {/* New Comment Form */}
      <form onSubmit={(e) => handleSubmit(e)} className="flex gap-2">
        <input
          name="content"
          placeholder="Ajouter un commentaire..."
          className="flex-1 rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] px-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399]"
          required
        />
        <Button type="submit" size="sm" loading={loading}>
          Envoyer
        </Button>
      </form>

      {/* Comments List */}
      {topLevelComments.length === 0 ? (
        <p className="text-center text-[#888] text-sm py-4">Aucun commentaire</p>
      ) : (
        <div className="space-y-2">
          {topLevelComments.map((comment) => (
            <div key={comment.id}>
              <CommentBubble
                comment={comment}
                currentUserId={currentUserId}
                onDelete={() => handleDelete(comment.id)}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              />

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-1 space-y-1">
                  {comment.replies.map((reply) => (
                    <CommentBubble
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      onDelete={() => handleDelete(reply.id)}
                      isReply
                    />
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {replyTo === comment.id && (
                <form
                  onSubmit={(e) => handleSubmit(e, comment.id)}
                  className="ml-8 mt-1 flex gap-2"
                >
                  <input
                    name="content"
                    placeholder="Repondre..."
                    className="flex-1 rounded-lg bg-[#0A0A0B] border border-[#2A2A2E] px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399]"
                    required
                    autoFocus
                  />
                  <Button type="submit" size="sm" loading={loading}>
                    Envoyer
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommentBubble({
  comment,
  currentUserId,
  onDelete,
  onReply,
  isReply,
}: {
  comment: {
    id: string
    content: string
    createdAt: string | Date
    author: { id: string; username: string; avatar: string | null }
  }
  currentUserId: string
  onDelete: () => void
  onReply?: () => void
  isReply?: boolean
}) {
  const isAuthor = comment.author.id === currentUserId

  return (
    <div className={`flex gap-2 ${isReply ? "" : ""}`}>
      <div className="w-7 h-7 rounded-full bg-[#2A2A2E] flex items-center justify-center text-[10px] font-bold text-[#F5F5F5] shrink-0">
        {comment.author.avatar || getInitials(comment.author.username)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-[#1C1C1F] rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5F5F5]">{comment.author.username}</span>
            <span className="text-[10px] text-[#888]">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-[#F5F5F5] mt-0.5">{comment.content}</p>
        </div>
        <div className="flex gap-3 mt-0.5 ml-2">
          {onReply && (
            <button onClick={onReply} className="text-[10px] text-[#888] hover:text-[#34D399]">
              Repondre
            </button>
          )}
          {isAuthor && (
            <button onClick={onDelete} className="text-[10px] text-[#888] hover:text-red-400">
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
