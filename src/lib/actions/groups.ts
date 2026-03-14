"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createGroupSchema } from "@/lib/validators"
import { generateCode } from "@/lib/utils"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function createGroup(
  formData: FormData
): Promise<ActionResult<{ id: string; code: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    emoji: (formData.get("emoji") as string) || undefined,
  }

  const parsed = createGroupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const userId = session.user.id
  const code = generateCode(8)

  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        emoji: parsed.data.emoji,
        code,
      },
    })

    await tx.groupMember.create({
      data: {
        userId,
        groupId: newGroup.id,
        role: "ADMIN",
      },
    })

    return newGroup
  })

  revalidatePath("/dashboard")
  return { success: true, data: { id: group.id, code: group.code } }
}

export async function joinGroup(
  code: string
): Promise<ActionResult<{ groupId: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const group = await prisma.group.findUnique({
    where: { code },
  })

  if (!group) {
    return { success: false, error: "Groupe introuvable" }
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: group.id,
      },
    },
  })

  if (existingMember) {
    return { success: false, error: "Vous etes deja membre de ce groupe" }
  }

  await prisma.groupMember.create({
    data: {
      userId: session.user.id,
      groupId: group.id,
      role: "MEMBER",
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/groups/${group.id}`)
  return { success: true, data: { groupId: group.id } }
}

export async function getMyGroups(): Promise<
  ActionResult<
    Array<{
      id: string
      name: string
      emoji: string | null
      description: string | null
      code: string
      role: string
      memberCount: number
      wordCount: number
      latestWord: { id: string; term: string; createdAt: Date } | null
    }>
  >
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          _count: {
            select: {
              members: true,
              words: true,
            },
          },
          words: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              term: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const groups = memberships.map((m: typeof memberships[number]) => ({
    id: m.group.id,
    name: m.group.name,
    emoji: m.group.emoji,
    description: m.group.description,
    code: m.group.code,
    role: m.role,
    memberCount: m.group._count.members,
    wordCount: m.group._count.words,
    latestWord: m.group.words[0] ?? null,
  }))

  return { success: true, data: groups }
}

export async function getGroup(
  groupId: string
): Promise<
  ActionResult<{
    id: string
    name: string
    description: string | null
    emoji: string | null
    code: string
    isPublic: boolean
    createdAt: Date
    memberCount: number
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

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: {
        select: { members: true },
      },
    },
  })

  if (!group) {
    return { success: false, error: "Groupe introuvable" }
  }

  return {
    success: true,
    data: {
      id: group.id,
      name: group.name,
      description: group.description,
      emoji: group.emoji,
      code: group.code,
      isPublic: group.isPublic,
      createdAt: group.createdAt,
      memberCount: group._count.members,
    },
  }
}

export async function updateGroup(
  groupId: string,
  formData: FormData
): Promise<ActionResult> {
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

  if (!membership || membership.role !== "ADMIN") {
    return { success: false, error: "Action reservee aux administrateurs" }
  }

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    emoji: (formData.get("emoji") as string) || undefined,
  }

  const parsed = createGroupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  await prisma.group.update({
    where: { id: groupId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      emoji: parsed.data.emoji,
    },
  })

  revalidatePath(`/groups/${groupId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
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

  if (!membership || membership.role !== "ADMIN") {
    return { success: false, error: "Action reservee aux administrateurs" }
  }

  await prisma.group.delete({
    where: { id: groupId },
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
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

  if (membership.role === "ADMIN") {
    const adminCount = await prisma.groupMember.count({
      where: {
        groupId,
        role: "ADMIN",
      },
    })

    if (adminCount <= 1) {
      return {
        success: false,
        error:
          "Vous etes le dernier administrateur. Promouvez un membre avant de quitter.",
      }
    }
  }

  await prisma.groupMember.delete({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
  })

  revalidatePath("/dashboard")
  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function getGroupMembers(
  groupId: string
): Promise<
  ActionResult<
    Array<{
      id: string
      userId: string
      username: string
      email: string
      avatar: string | null
      role: string
      joinedAt: Date
    }>
  >
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

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  })

  const data = members.map((m: typeof members[number]) => ({
    id: m.id,
    userId: m.user.id,
    username: m.user.username,
    email: m.user.email,
    avatar: m.user.avatar,
    role: m.role,
    joinedAt: m.joinedAt,
  }))

  return { success: true, data }
}

export async function removeMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const adminMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
  })

  if (!adminMembership || adminMembership.role !== "ADMIN") {
    return { success: false, error: "Action reservee aux administrateurs" }
  }

  if (userId === session.user.id) {
    return { success: false, error: "Vous ne pouvez pas vous retirer vous-meme" }
  }

  const targetMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  if (!targetMembership) {
    return { success: false, error: "Membre introuvable" }
  }

  await prisma.groupMember.delete({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function promoteMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const adminMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId,
      },
    },
  })

  if (!adminMembership || adminMembership.role !== "ADMIN") {
    return { success: false, error: "Action reservee aux administrateurs" }
  }

  const targetMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  })

  if (!targetMembership) {
    return { success: false, error: "Membre introuvable" }
  }

  if (targetMembership.role === "ADMIN") {
    return { success: false, error: "Ce membre est deja administrateur" }
  }

  await prisma.groupMember.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: { role: "ADMIN" },
  })

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}
