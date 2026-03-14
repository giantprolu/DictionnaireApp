"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type ActionResult<T = undefined> = {
  success: boolean
  data?: T
  error?: string
}

interface UnlockedAchievement {
  id: string
  code: string
  name: string
  description: string
  emoji: string
}

export async function checkAndUnlockAchievements(
  userId: string
): Promise<ActionResult<UnlockedAchievement[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifie" }
  }

  // Fetch all achievements and the user's already unlocked ones
  const [allAchievements, unlockedAchievements] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ])

  const unlockedIds = new Set(
    unlockedAchievements.map((ua: typeof unlockedAchievements[number]) => ua.achievementId)
  )
  const lockedAchievements = allAchievements.filter(
    (a: typeof allAchievements[number]) => !unlockedIds.has(a.id)
  )

  if (lockedAchievements.length === 0) {
    return { success: true, data: [] }
  }

  // Gather user stats in parallel
  const [
    wordCount,
    commentCount,
    voteCount,
    reactionCount,
    definitionVoteStats,
    memberGroupIds,
  ] = await Promise.all([
    prisma.word.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.vote.count({ where: { userId } }),
    prisma.reaction.count({ where: { userId } }),
    // Sum of positive votes received on user's definitions
    prisma.vote.aggregate({
      where: {
        definition: { authorId: userId },
        value: { gt: 0 },
      },
      _sum: { value: true },
    }),
    // Groups the user belongs to
    prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    }),
  ])

  const totalPositiveVotesReceived = definitionVoteStats._sum.value ?? 0

  // For GATHERER: check member counts of groups the user admins
  const adminGroups = await prisma.groupMember.findMany({
    where: { userId, role: "ADMIN" },
    select: { groupId: true },
  })

  let maxGroupMemberCount = 0
  if (adminGroups.length > 0) {
    const groupMemberCounts = await Promise.all(
      adminGroups.map((ag: typeof adminGroups[number]) =>
        prisma.groupMember.count({ where: { groupId: ag.groupId } })
      )
    )
    maxGroupMemberCount = Math.max(...groupMemberCounts, 0)
  }

  // For SNIPER: check if user added a word within the first minute of joining any group
  let isSniperQualified = false
  if (memberGroupIds.length > 0) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true, joinedAt: true },
    })

    for (const m of memberships) {
      const oneMinuteAfterJoin = new Date(m.joinedAt.getTime() + 60_000)
      const earlyWord = await prisma.word.findFirst({
        where: {
          authorId: userId,
          groupId: m.groupId,
          createdAt: {
            lte: oneMinuteAfterJoin,
          },
        },
      })
      if (earlyWord) {
        isSniperQualified = true
        break
      }
    }
  }

  // Determine which achievements should be unlocked
  const newlyUnlocked: UnlockedAchievement[] = []

  for (const achievement of lockedAchievements) {
    let qualified = false

    switch (achievement.code) {
      case "FIRST_WORD":
        qualified = wordCount >= achievement.threshold
        break
      case "LEXICOGRAPHER":
        qualified = wordCount >= achievement.threshold
        break
      case "ENCYCLOPEDIST":
        qualified = wordCount >= achievement.threshold
        break
      case "CHATTERBOX":
        qualified = commentCount >= achievement.threshold
        break
      case "CRITIC":
        qualified = voteCount >= achievement.threshold
        break
      case "CLOWN":
        qualified = reactionCount >= achievement.threshold
        break
      case "HEARTTHROB":
        qualified = totalPositiveVotesReceived >= achievement.threshold
        break
      case "GATHERER":
        qualified = maxGroupMemberCount >= achievement.threshold
        break
      case "SNIPER":
        qualified = isSniperQualified
        break
      default:
        break
    }

    if (qualified) {
      newlyUnlocked.push({
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        emoji: achievement.emoji,
      })
    }
  }

  // Unlock all qualified achievements in a transaction
  if (newlyUnlocked.length > 0) {
    await prisma.$transaction(
      newlyUnlocked.map((a) =>
        prisma.userAchievement.create({
          data: {
            userId,
            achievementId: a.id,
          },
        })
      )
    )
  }

  return { success: true, data: newlyUnlocked }
}
