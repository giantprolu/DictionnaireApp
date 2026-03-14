"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createWord } from "@/lib/actions/words"

export default function NewWordPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNSFW, setIsNSFW] = useState(false)
  const [tags, setTags] = useState<{ id: string; name: string; color: string | null }[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/tags")
        if (res.ok) {
          const data = await res.json()
          setTags(data)
        }
      } catch {
        // Tags are optional
      }
    }
    loadTags()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.set("isNSFW", String(isNSFW))
    formData.set("tagIds", JSON.stringify(selectedTags))

    const result = await createWord(groupId, formData)
    if (result.success && result.data) {
      router.push(`/groups/${groupId}/words/${result.data.id}`)
    } else {
      setError(result.error || "Erreur lors de l'ajout")
      setLoading(false)
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Ajouter un mot</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="term" label="Mot / Expression" placeholder="Bordéliser" required />

        <Input name="phonetic" label="Prononciation (optionnel)" placeholder="[bor-dé-li-zé]" />

        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Definition</label>
          <textarea
            name="content"
            placeholder="Mettre un bordel monstre quelque part..."
            className="w-full rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] px-4 py-3 text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399] resize-none"
            rows={3}
            required
          />
        </div>

        <Input name="example" label="Exemple d'utilisation (optionnel)" placeholder="'Il a complètement bordélisé le salon'" />

        <Input name="origin" label="Origine / Contexte (optionnel)" placeholder="Soirée chez Kevin, 3h du mat" />

        {/* NSFW Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNSFW(!isNSFW)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isNSFW ? "bg-red-500" : "bg-[#2A2A2E]"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isNSFW ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span className="text-sm text-[#888]">Contenu NSFW 🔞</span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTags.includes(tag.id)
                      ? "ring-2 ring-offset-1 ring-offset-[#0A0A0B]"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `${tag.color || "#6B7280"}20`,
                    color: tag.color || "#6B7280",
                    borderColor: tag.color || "#6B7280",
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Ajouter au dico
        </Button>
      </form>
    </div>
  )
}
