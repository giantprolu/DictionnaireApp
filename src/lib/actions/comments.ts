"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createCommentSchema } from "@/lib/validators"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function addComment(
  wordId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    select: { id: true, groupId: true },
  })

  if (!word) {
    return { success: false, error: "Mot introuvable" }
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: word.groupId,
      },
    },
  })

  if (!membership) {
    return { success: false, error: "Vous n'etes pas membre de ce groupe" }
  }

  const raw = {
    content: formData.get("content") as string,
    parentId: (formData.get("parentId") as string) || undefined,
  }

  const parsed = createCommentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // If parentId is provided, verify it belongs to the same word
  if (parsed.data.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { wordId: true },
    })

    if (!parentComment || parentComment.wordId !== wordId) {
      return { success: false, error: "Commentaire parent invalide" }
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      authorId: session.user.id,
      wordId,
      parentId: parsed.data.parentId,
    },
  })

  revalidatePath(`/groups/${word.groupId}`)
  revalidatePath(`/groups/${word.groupId}/words/${wordId}`)
  return { success: true, data: { id: comment.id } }
}

export async function deleteComment(
  commentId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      word: {
        select: { groupId: true },
      },
    },
  })

  if (!comment) {
    return { success: false, error: "Commentaire introuvable" }
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: comment.word.groupId,
      },
    },
  })

  if (
    comment.authorId !== session.user.id &&
    (!membership || membership.role !== "ADMIN")
  ) {
    return {
      success: false,
      error:
        "Seul l'auteur ou un administrateur peut supprimer ce commentaire",
    }
  }

  await prisma.comment.delete({
    where: { id: commentId },
  })

  revalidatePath(`/groups/${comment.word.groupId}`)
  revalidatePath(`/groups/${comment.word.groupId}/words/${comment.wordId}`)
  return { success: true }
}

export async function getComments(
  wordId: string
): Promise<
  ActionResult<
    Array<{
      id: string
      content: string
      createdAt: Date
      author: { id: string; username: string; avatar: string | null }
      parentId: string | null
      replies: Array<{
        id: string
        content: string
        createdAt: Date
        author: { id: string; username: string; avatar: string | null }
      }>
    }>
  >
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    select: { groupId: true },
  })

  if (!word) {
    return { success: false, error: "Mot introuvable" }
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: word.groupId,
      },
    },
  })

  if (!membership) {
    return { success: false, error: "Vous n'etes pas membre de ce groupe" }
  }

  // Fetch top-level comments (no parent) with their replies (1 level)
  const comments = await prisma.comment.findMany({
    where: {
      wordId,
      parentId: null,
    },
    include: {
      author: {
        select: { id: true, username: true, avatar: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const data = comments.map((c: typeof comments[number]) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: c.author,
    parentId: c.parentId,
    replies: c.replies.map((r: typeof c.replies[number]) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      author: r.author,
    })),
  }))

  return { success: true, data }
}
