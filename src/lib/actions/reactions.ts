"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function toggleReaction(
  emoji: string,
  wordId?: string,
  definitionId?: string
): Promise<
  ActionResult<Array<{ emoji: string; count: number; userIds: string[] }>>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  if (!wordId && !definitionId) {
    return { success: false, error: "Un mot ou une definition est requis" }
  }

  // Verify membership via the word's group
  let groupId: string

  if (wordId) {
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: { groupId: true },
    })
    if (!word) {
      return { success: false, error: "Mot introuvable" }
    }
    groupId = word.groupId
  } else {
    const definition = await prisma.definition.findUnique({
      where: { id: definitionId },
      include: { word: { select: { groupId: true } } },
    })
    if (!definition) {
      return { success: false, error: "Definition introuvable" }
    }
    groupId = definition.word.groupId
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
  })

  if (!membership) {
    return { success: false, error: "Vous n'etes pas membre de ce groupe" }
  }

  // Toggle: find existing reaction and delete, or create new one
  if (wordId) {
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_wordId_emoji: {
          userId: session.user.id,
          wordId,
          emoji,
        },
      },
    })

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.reaction.create({
        data: {
          emoji,
          userId: session.user.id,
          wordId,
        },
      })
    }

    // Fetch updated reactions for the word
    const reactions = await prisma.reaction.findMany({
      where: { wordId },
      select: { emoji: true, userId: true },
    })

    const reactionMap = new Map<string, { count: number; userIds: string[] }>()
    for (const r of reactions) {
      const entry = reactionMap.get(r.emoji)
      if (entry) {
        entry.count++
        entry.userIds.push(r.userId)
      } else {
        reactionMap.set(r.emoji, { count: 1, userIds: [r.userId] })
      }
    }

    const aggregated = Array.from(reactionMap.entries()).map(
      ([e, { count, userIds }]) => ({ emoji: e, count, userIds })
    )

    revalidatePath(`/groups/${groupId}`)
    return { success: true, data: aggregated }
  } else {
    // definitionId is guaranteed non-undefined here
    const defId = definitionId!

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_definitionId_emoji: {
          userId: session.user.id,
          definitionId: defId,
          emoji,
        },
      },
    })

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.reaction.create({
        data: {
          emoji,
          userId: session.user.id,
          definitionId: defId,
        },
      })
    }

    const reactions = await prisma.reaction.findMany({
      where: { definitionId: defId },
      select: { emoji: true, userId: true },
    })

    const reactionMap = new Map<string, { count: number; userIds: string[] }>()
    for (const r of reactions) {
      const entry = reactionMap.get(r.emoji)
      if (entry) {
        entry.count++
        entry.userIds.push(r.userId)
      } else {
        reactionMap.set(r.emoji, { count: 1, userIds: [r.userId] })
      }
    }

    const aggregated = Array.from(reactionMap.entries()).map(
      ([e, { count, userIds }]) => ({ emoji: e, count, userIds })
    )

    revalidatePath(`/groups/${groupId}`)
    return { success: true, data: aggregated }
  }
}
