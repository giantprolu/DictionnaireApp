"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateProfileSchema } from "@/lib/validators"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const raw = {
    username: formData.get("username") as string,
    bio: (formData.get("bio") as string) || undefined,
    avatar: (formData.get("avatar") as string) || undefined,
  }

  const parsed = updateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // Check if username is taken by another user
  const existingUser = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  })

  if (existingUser && existingUser.id !== session.user.id) {
    return { success: false, error: "Ce pseudo est deja pris" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username: parsed.data.username,
      bio: parsed.data.bio,
      avatar: parsed.data.avatar,
    },
  })

  revalidatePath("/profile")
  return { success: true }
}

export async function getProfile(): Promise<
  ActionResult<{
    id: string
    email: string
    username: string
    avatar: string | null
    bio: string | null
    createdAt: Date
    achievements: Array<{
      id: string
      unlockedAt: Date
      achievement: {
        id: string
        code: string
        name: string
        description: string
        emoji: string
        threshold: number
      }
    }>
  }>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      achievements: {
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: "desc" },
      },
    },
  })

  if (!user) {
    return { success: false, error: "Utilisateur introuvable" }
  }

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      achievements: user.achievements.map((ua: typeof user.achievements[number]) => ({
        id: ua.id,
        unlockedAt: ua.unlockedAt,
        achievement: {
          id: ua.achievement.id,
          code: ua.achievement.code,
          name: ua.achievement.name,
          description: ua.achievement.description,
          emoji: ua.achievement.emoji,
          threshold: ua.achievement.threshold,
        },
      })),
    },
  }
}
