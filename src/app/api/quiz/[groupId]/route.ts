import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 })
  }

  const { groupId } = await params

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })
  if (!membership) {
    return NextResponse.json([], { status: 403 })
  }

  const words = await prisma.word.findMany({
    where: { groupId, definitions: { some: {} } },
    select: {
      term: true,
      definitions: {
        where: { isOriginal: true },
        take: 1,
        select: { content: true },
      },
    },
  })

  if (words.length < 4) {
    return NextResponse.json([])
  }

  const shuffled = words.sort(() => Math.random() - 0.5)
  const questionCount = Math.min(10, shuffled.length)
  const questions = []

  for (let i = 0; i < questionCount; i++) {
    const correct = shuffled[i]
    const correctDef = correct.definitions[0]?.content || ""

    const wrongDefs = shuffled
      .filter((_, idx) => idx !== i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definitions[0]?.content || "")

    const options = [...wrongDefs, correctDef].sort(() => Math.random() - 0.5)
    const correctIndex = options.indexOf(correctDef)

    questions.push({
      word: correct.term,
      correctDefinition: correctDef,
      options,
      correctIndex,
    })
  }

  return NextResponse.json(questions)
}
