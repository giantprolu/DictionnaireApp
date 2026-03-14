import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const achievements = [
  { code: "FIRST_WORD", name: "Premier Mot", description: "Ajouter son premier mot", emoji: "🏆", threshold: 1 },
  { code: "LEXICOGRAPHER", name: "Lexicographe", description: "Ajouter 10 mots", emoji: "📝", threshold: 10 },
  { code: "ENCYCLOPEDIST", name: "Encyclopédiste", description: "Ajouter 50 mots", emoji: "📚", threshold: 50 },
  { code: "ON_FIRE", name: "En Feu", description: "Ajouter un mot 5 jours de suite", emoji: "🔥", threshold: 5 },
  { code: "CHATTERBOX", name: "Bavard", description: "Écrire 20 commentaires", emoji: "💬", threshold: 20 },
  { code: "CRITIC", name: "Critique", description: "Voter 50 fois", emoji: "👍", threshold: 50 },
  { code: "CLOWN", name: "Bouffon Officiel", description: "Avoir un mot avec 10+ 💀", emoji: "🤡", threshold: 10 },
  { code: "HEARTTHROB", name: "Coup de Coeur", description: "Avoir une déf avec 10+ upvotes", emoji: "❤️", threshold: 10 },
  { code: "SNIPER", name: "Sniper", description: "Déf alternative qui bat l'originale", emoji: "🎯", threshold: 1 },
  { code: "GATHERER", name: "Rassembleur", description: "Créer un groupe avec 10+ membres", emoji: "👥", threshold: 10 },
]

const tags = [
  { name: "insulte-affectueuse", color: "#EF4444" },
  { name: "private-joke", color: "#F59E0B" },
  { name: "soirée", color: "#8B5CF6" },
  { name: "nourriture", color: "#10B981" },
  { name: "gaming", color: "#3B82F6" },
  { name: "expression", color: "#EC4899" },
  { name: "verlan", color: "#6366F1" },
  { name: "onomatopée", color: "#F97316" },
  { name: "inclassable", color: "#6B7280" },
]

async function main() {
  console.log("Seeding achievements...")
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    })
  }
  console.log(`${achievements.length} achievements seeded`)

  console.log("Seeding tags...")
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    })
  }
  console.log(`${tags.length} tags seeded`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
