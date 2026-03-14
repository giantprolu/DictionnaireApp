import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wordId: string }> }
) {
  const { wordId } = await params

  const word = await prisma.word.findUnique({
    where: { id: wordId },
    select: {
      term: true,
      phonetic: true,
      group: { select: { name: true, emoji: true } },
      definitions: {
        where: { isOriginal: true },
        take: 1,
        select: { content: true },
      },
      author: { select: { username: true } },
    },
  })

  if (!word) {
    return new Response("Not found", { status: 404 })
  }

  const definition = word.definitions[0]?.content || ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A0A0B",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "900px",
          }}
        >
          <div style={{ fontSize: "20px", color: "#34D399", marginBottom: "20px", display: "flex" }}>
            {word.group.emoji} {word.group.name}
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "#F5F5F5",
              fontFamily: "monospace",
              marginBottom: "10px",
              display: "flex",
            }}
          >
            {word.term}
          </div>
          {word.phonetic && (
            <div style={{ fontSize: "24px", color: "#888", fontFamily: "monospace", marginBottom: "20px", display: "flex" }}>
              {word.phonetic}
            </div>
          )}
          <div
            style={{
              fontSize: "28px",
              color: "#F5F5F5",
              textAlign: "center",
              lineHeight: "1.4",
              maxWidth: "800px",
              display: "flex",
            }}
          >
            {definition.length > 150 ? definition.slice(0, 147) + "..." : definition}
          </div>
          <div style={{ fontSize: "18px", color: "#888", marginTop: "30px", display: "flex" }}>
            Val&apos;tionnaire — par {word.author.username}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
