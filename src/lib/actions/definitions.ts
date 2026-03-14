"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createDefinitionSchema } from "@/lib/validators"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function addDefinition(
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
    example: (formData.get("example") as string) || undefined,
  }

  const parsed = createDefinitionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const definition = await prisma.definition.create({
    data: {
      content: parsed.data.content,
      example: parsed.data.example,
      isOriginal: false,
      authorId: session.user.id,
      wordId,
    },
  })

  revalidatePath(`/groups/${word.groupId}`)
  revalidatePath(`/groups/${word.groupId}/words/${wordId}`)
  return { success: true, data: { id: definition.id } }
}

export async function updateDefinition(
  definitionId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const definition = await prisma.definition.findUnique({
    where: { id: definitionId },
    include: {
      word: {
        select: { groupId: true },
      },
    },
  })

  if (!definition) {
    return { success: false, error: "Definition introuvable" }
  }

  if (definition.authorId !== session.user.id) {
    return {
      success: false,
      error: "Seul l'auteur peut modifier cette definition",
    }
  }

  const raw = {
    content: formData.get("content") as string,
    example: (formData.get("example") as string) || undefined,
  }

  const parsed = createDefinitionSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  await prisma.definition.update({
    where: { id: definitionId },
    data: {
      content: parsed.data.content,
      example: parsed.data.example,
    },
  })

  revalidatePath(`/groups/${definition.word.groupId}`)
  revalidatePath(
    `/groups/${definition.word.groupId}/words/${definition.wordId}`
  )
  return { success: true }
}

export async function deleteDefinition(
  definitionId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const definition = await prisma.definition.findUnique({
    where: { id: definitionId },
    include: {
      word: {
        select: { groupId: true },
      },
    },
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

  if (
    definition.authorId !== session.user.id &&
    (!membership || membership.role !== "ADMIN")
  ) {
    return {
      success: false,
      error:
        "Seul l'auteur ou un administrateur peut supprimer cette definition",
    }
  }

  await prisma.definition.delete({
    where: { id: definitionId },
  })

  revalidatePath(`/groups/${definition.word.groupId}`)
  revalidatePath(
    `/groups/${definition.word.groupId}/words/${definition.wordId}`
  )
  return { success: true }
}
