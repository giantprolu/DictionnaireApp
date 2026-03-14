"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addDefinition } from "@/lib/actions/definitions"

interface Props {
  wordId: string
}

export function AddDefinitionForm({ wordId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const result = await addDefinition(wordId, formData)

    if (result.success) {
      setOpen(false)
      e.currentTarget.reset()
    } else {
      setError(result.error || "Erreur")
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl border border-dashed border-[#2A2A2E] text-sm text-[#888] hover:text-[#34D399] hover:border-[#34D399]/30 transition-colors"
      >
        + Proposer une definition alternative
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-[#1C1C1F] rounded-xl p-4 border border-[#2A2A2E]">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <textarea
        name="content"
        placeholder="Ta definition..."
        className="w-full rounded-lg bg-[#0A0A0B] border border-[#2A2A2E] px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399] resize-none"
        rows={2}
        required
      />
      <input
        name="example"
        placeholder="Exemple d'utilisation (optionnel)"
        className="w-full rounded-lg bg-[#0A0A0B] border border-[#2A2A2E] px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399]"
      />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button type="submit" size="sm" loading={loading}>
          Ajouter
        </Button>
      </div>
    </form>
  )
}
