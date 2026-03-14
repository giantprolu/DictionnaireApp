"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createGroup } from "@/lib/actions/groups"

const EMOJI_OPTIONS = ["📖", "🔥", "💀", "🎮", "🍕", "🎉", "💬", "🤡", "❤️", "⚡", "🎯", "🌙"]

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("📖")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.set("emoji", selectedEmoji)

    const result = await createGroup(formData)
    if (result.success && result.data) {
      router.push(`/groups/${result.data.id}`)
    } else {
      setError(result.error || "Erreur lors de la creation")
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Creer un groupe</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" label="Nom du groupe" placeholder="Les Zinzins du vocabulaire" required />

        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Description (optionnel)</label>
          <textarea
            name="description"
            placeholder="Le dico officiel de notre bande..."
            className="w-full rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] px-4 py-3 text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399] resize-none"
            rows={3}
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Emoji du groupe</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  selectedEmoji === emoji
                    ? "bg-[#34D399]/20 ring-2 ring-[#34D399] scale-110"
                    : "bg-[#1C1C1F] hover:bg-[#2A2A2E]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Creer le groupe
        </Button>
      </form>
    </div>
  )
}
