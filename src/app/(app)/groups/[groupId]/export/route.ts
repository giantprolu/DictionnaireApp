import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  const { groupId } = await params

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  })
  if (!membership) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, emoji: true },
  })

  const words = await prisma.word.findMany({
    where: { groupId },
    orderBy: { term: "asc" },
    select: {
      term: true,
      phonetic: true,
      origin: true,
      author: { select: { username: true } },
      definitions: {
        orderBy: { createdAt: "asc" },
        select: {
          content: true,
          example: true,
          author: { select: { username: true } },
        },
      },
    },
  })

  let text = `${group?.emoji || "📖"} ${group?.name || "Val'tionnaire"}\n`
  text += `${"=".repeat(40)}\n`
  text += `Exporte le ${new Date().toLocaleDateString("fr-FR")}\n`
  text += `${words.length} mots\n\n`

  for (const word of words) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    text += `${word.term.toUpperCase()}`
    if (word.phonetic) text += ` ${word.phonetic}`
    text += `\n`
    if (word.origin) text += `  Origine: ${word.origin}\n`
    text += `  Ajoute par: ${word.author.username}\n\n`

    word.definitions.forEach((def, i) => {
      text += `  ${i + 1}. ${def.content}\n`
      if (def.example) text += `     Ex: "${def.example}"\n`
      text += `     — ${def.author.username}\n\n`
    })
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `Genere par Val'tionnaire\n`

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="valtionnaire-${group?.name?.replace(/\s+/g, "-").toLowerCase() || "export"}.txt"`,
    },
  })
}
