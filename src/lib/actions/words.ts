"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createWordSchema } from "@/lib/validators"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function createWord(
  groupId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const userId = session.user.id

  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  if (!membership) {
    return { success: false, error: "Vous n'etes pas membre de ce groupe" }
  }

  const tagIdsRaw = formData.get("tagIds")
  let tagIds: string[] = []
  if (typeof tagIdsRaw === "string" && tagIdsRaw.length > 0) {
    try {
      tagIds = JSON.parse(tagIdsRaw) as string[]
    } catch {
      tagIds = []
    }
  }

  const raw = {
    term: formData.get("term") as string,
    phonetic: (formData.get("phonetic") as string) || undefined,
    origin: (formData.get("origin") as string) || undefined,
    isNSFW: formData.get("isNSFW") === "true",
    content: formData.get("content") as string,
    example: (formData.get("example") as string) || undefined,
    tagIds: tagIds.length > 0 ? tagIds : undefined,
  }

  const parsed = createWordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const word = await prisma.$transaction(async (tx) => {
    const newWord = await tx.word.create({
      data: {
        term: parsed.data.term,
        phonetic: parsed.data.phonetic,
        origin: parsed.data.origin,
        isNSFW: parsed.data.isNSFW,
        authorId: userId,
        groupId,
        tags:
          parsed.data.tagIds && parsed.data.tagIds.length > 0
            ? {
                create: parsed.data.tagIds.map((tagId: string) => ({
                  tagId,
                })),
              }
            : undefined,
      },
    })

    await tx.definition.create({
      data: {
        content: parsed.data.content,
        example: parsed.data.example,
        isOriginal: true,
        authorId: userId,
        wordId: newWord.id,
      },
    })

    return newWord
  })

  revalidatePath(`/groups/${groupId}`)
  return { success: true, data: { id: word.id } }
}

export async function getGroupWords(
  groupId: string,
  options?: {
    sort?: string
    search?: string
    tag?: string
    page?: number
  }
): Promise<
  ActionResult<{
    words: Array<{
      id: string
      term: string
      phonetic: string | null
      isNSFW: boolean
      createdAt: Date
      author: { id: string; username: string; avatar: string | null }
      definitionCount: number
      reactionCount: number
      tags: Array<{ id: string; name: string; color: string | null }>
    }>
    totalCount: number
    page: number
    pageSize: number
  }>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
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

  const page = options?.page ?? 1
  const pageSize = 20
  const skip = (page - 1) * pageSize

  // Build where clause dynamically
  const whereConditions: Record<string, unknown> = { groupId }

  if (options?.search) {
    whereConditions.term = { contains: options.search, mode: "insensitive" }
  }

  if (options?.tag) {
    whereConditions.tags = {
      some: { tagId: options.tag },
    }
  }

  // Build orderBy clause
  let orderBy: Record<string, unknown>
  switch (options?.sort) {
    case "oldest":
      orderBy = { createdAt: "asc" }
      break
    case "alpha-asc":
      orderBy = { term: "asc" }
      break
    case "alpha-desc":
      orderBy = { term: "desc" }
      break
    case "popular":
      orderBy = { reactions: { _count: "desc" } }
      break
    case "recent":
    default:
      orderBy = { createdAt: "desc" }
      break
  }

  const [words, totalCount] = await Promise.all([
    prisma.word.findMany({
      where: whereConditions,
      orderBy,
      skip,
      take: pageSize,
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: {
            definitions: true,
            reactions: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    }),
    prisma.word.count({ where: whereConditions }),
  ])

  const data = words.map((w: typeof words[number]) => ({
    id: w.id,
    term: w.term,
    phonetic: w.phonetic,
    isNSFW: w.isNSFW,
    createdAt: w.createdAt,
    author: w.author,
    definitionCount: w._count.definitions,
    reactionCount: w._count.reactions,
    tags: w.tags.map((t: typeof w.tags[number]) => t.tag),
  }))

  return {
    success: true,
    data: { words: data, totalCount, page, pageSize },
  }
}

export async function getWord(
  wordId: string
): Promise<
  ActionResult<{
    id: string
    term: string
    phonetic: string | null
    origin: string | null
    isNSFW: boolean
    createdAt: Date
    groupId: string
    author: { id: string; username: string; avatar: string | null }
    definitions: Array<{
      id: string
      content: string
      example: string | null
      isOriginal: boolean
      createdAt: Date
      author: { id: string; username: string; avatar: string | null }
      votes: Array<{ userId: string; value: number }>
      voteScore: number
    }>
    reactions: Array<{ emoji: string; count: number; userIds: string[] }>
    comments: Array<{
      id: string
      content: string
      createdAt: Date
      author: { id: string; username: string; avatar: string | null }
      parentId: string | null
    }>
    tags: Array<{ id: string; name: string; color: string | null }>
  }>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: {
      author: {
        select: { id: true, username: true, avatar: true },
      },
      definitions: {
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          votes: {
            select: { userId: true, value: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: {
        select: { emoji: true, userId: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, color: true },
          },
        },
      },
    },
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

  // Aggregate reactions
  const reactionMap = new Map<string, { count: number; userIds: string[] }>()
  for (const r of word.reactions) {
    const existing = reactionMap.get(r.emoji)
    if (existing) {
      existing.count++
      existing.userIds.push(r.userId)
    } else {
      reactionMap.set(r.emoji, { count: 1, userIds: [r.userId] })
    }
  }

  const reactions = Array.from(reactionMap.entries()).map(
    ([emoji, { count, userIds }]) => ({
      emoji,
      count,
      userIds,
    })
  )

  const definitions = word.definitions.map((d: typeof word.definitions[number]) => ({
    id: d.id,
    content: d.content,
    example: d.example,
    isOriginal: d.isOriginal,
    createdAt: d.createdAt,
    author: d.author,
    votes: d.votes,
    voteScore: d.votes.reduce((sum: number, v: typeof d.votes[number]) => sum + v.value, 0),
  }))

  const comments = word.comments.map((c: typeof word.comments[number]) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: c.author,
    parentId: c.parentId,
  }))

  return {
    success: true,
    data: {
      id: word.id,
      term: word.term,
      phonetic: word.phonetic,
      origin: word.origin,
      isNSFW: word.isNSFW,
      createdAt: word.createdAt,
      groupId: word.groupId,
      author: word.author,
      definitions,
      reactions,
      comments,
      tags: word.tags.map((t: typeof word.tags[number]) => t.tag),
    },
  }
}

export async function updateWord(
  wordId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
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

  if (word.authorId !== session.user.id && membership.role !== "ADMIN") {
    return {
      success: false,
      error: "Seul l'auteur ou un administrateur peut modifier ce mot",
    }
  }

  const raw = {
    term: formData.get("term") as string,
    phonetic: (formData.get("phonetic") as string) || undefined,
    origin: (formData.get("origin") as string) || undefined,
    isNSFW: formData.get("isNSFW") === "true",
    content: formData.get("content") as string,
    example: (formData.get("example") as string) || undefined,
  }

  const parsed = createWordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  await prisma.word.update({
    where: { id: wordId },
    data: {
      term: parsed.data.term,
      phonetic: parsed.data.phonetic,
      origin: parsed.data.origin,
      isNSFW: parsed.data.isNSFW,
    },
  })

  revalidatePath(`/groups/${word.groupId}`)
  revalidatePath(`/groups/${word.groupId}/words/${wordId}`)
  return { success: true }
}

export async function deleteWord(wordId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const word = await prisma.word.findUnique({
    where: { id: wordId },
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

  if (word.authorId !== session.user.id && membership.role !== "ADMIN") {
    return {
      success: false,
      error: "Seul l'auteur ou un administrateur peut supprimer ce mot",
    }
  }

  await prisma.word.delete({
    where: { id: wordId },
  })

  revalidatePath(`/groups/${word.groupId}`)
  return { success: true }
}

export async function getRandomWord(
  groupId: string
): Promise<
  ActionResult<{
    id: string
    term: string
    phonetic: string | null
    createdAt: Date
    author: { id: string; username: string; avatar: string | null }
  } | null>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
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

  const wordCount = await prisma.word.count({ where: { groupId } })

  if (wordCount === 0) {
    return { success: true, data: null }
  }

  const skip = Math.floor(Math.random() * wordCount)

  const randomWord = await prisma.word.findFirst({
    where: { groupId },
    skip,
    include: {
      author: {
        select: { id: true, username: true, avatar: true },
      },
    },
  })

  if (!randomWord) {
    return { success: true, data: null }
  }

  return {
    success: true,
    data: {
      id: randomWord.id,
      term: randomWord.term,
      phonetic: randomWord.phonetic,
      createdAt: randomWord.createdAt,
      author: randomWord.author,
    },
  }
}

export async function getWordOfTheDay(
  groupId: string
): Promise<
  ActionResult<{
    id: string
    term: string
    phonetic: string | null
    origin: string | null
    createdAt: Date
    author: { id: string; username: string; avatar: string | null }
    definition: {
      id: string
      content: string
      example: string | null
    } | null
  } | null>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const wotdInclude = {
    word: {
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        definitions: {
          where: { isOriginal: true },
          take: 1,
          select: { id: true, content: true, example: true },
        },
      },
    },
  } as const

  let wotd = await prisma.wordOfTheDay.findUnique({
    where: {
      groupId_date: {
        groupId,
        date: today,
      },
    },
    include: wotdInclude,
  })

  if (!wotd) {
    const wordCount = await prisma.word.count({ where: { groupId } })

    if (wordCount === 0) {
      return { success: true, data: null }
    }

    const skip = Math.floor(Math.random() * wordCount)
    const randomWord = await prisma.word.findFirst({
      where: { groupId },
      skip,
    })

    if (!randomWord) {
      return { success: true, data: null }
    }

    wotd = await prisma.wordOfTheDay.create({
      data: {
        date: today,
        wordId: randomWord.id,
        groupId,
      },
      include: wotdInclude,
    })
  }

  return {
    success: true,
    data: {
      id: wotd.word.id,
      term: wotd.word.term,
      phonetic: wotd.word.phonetic,
      origin: wotd.word.origin,
      createdAt: wotd.word.createdAt,
      author: wotd.word.author,
      definition: wotd.word.definitions[0] ?? null,
    },
  }
}
