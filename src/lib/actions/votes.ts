"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function vote(
  definitionId: string,
  value: number
): Promise<ActionResult<{ voteCount: number }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  if (value !== 1 && value !== -1) {
    return { success: false, error: "La valeur du vote doit etre +1 ou -1" }
  }

  const definition = await prisma.definition.findUnique({
    where: { id: definitionId },
    include: { word: { select: { groupId: true } } },
  })

  if (!definition) {
    return { success: false, error: "Definition introuvable" }
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: definition.word.groupId,
      },
    },
  })

  if (!membership) {
    return { success: false, error: "Vous n'etes pas membre de ce groupe" }
  }

  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_definitionId: {
        userId: session.user.id,
        definitionId,
      },
    },
  })

  if (existingVote) {
    if (existingVote.value === value) {
      // Same vote: remove it
      await prisma.vote.delete({
        where: { id: existingVote.id },
      })
    } else {
      // Opposite vote: update it
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { value },
      })
    }
  } else {
    // No existing vote: create it
    await prisma.vote.create({
      data: {
        value,
        userId: session.user.id,
        definitionId,
      },
    })
  }

  // Calculate new vote count
  const votes = await prisma.vote.findMany({
    where: { definitionId },
    select: { value: true },
  })

  const voteCount = votes.reduce((sum: number, v: typeof votes[number]) => sum + v.value, 0)

  revalidatePath(`/groups/${definition.word.groupId}`)
  return { success: true, data: { voteCount } }
}
