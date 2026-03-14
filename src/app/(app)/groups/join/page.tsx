"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinGroup } from "@/lib/actions/groups"

export default function JoinGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const code = (formData.get("code") as string)?.trim().toUpperCase()

    if (!code || code.length < 6) {
      setError("Code invalide")
      setLoading(false)
      return
    }

    const result = await joinGroup(code)
    if (result.success && result.data) {
      router.push(`/groups/${result.data.groupId}`)
    } else {
      setError(result.error || "Impossible de rejoindre ce groupe")
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Rejoindre un groupe</h1>

      <p className="text-[#888] text-sm">
        Entre le code d&apos;invitation ou utilise directement un lien d&apos;invitation.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="code"
          label="Code d'invitation"
          placeholder="ABCD1234"
          maxLength={12}
          className="text-center text-lg tracking-widest uppercase font-mono"
        />
        <Button type="submit" loading={loading} className="w-full">
          Rejoindre
        </Button>
      </form>
    </div>
  )
}
