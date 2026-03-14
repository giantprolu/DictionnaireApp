"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { joinGroup } from "@/lib/actions/groups"

interface Props {
  code: string
  groupId: string
}

export function JoinButton({ code, groupId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleJoin() {
    setLoading(true)
    setError("")
    const result = await joinGroup(code)
    if (result.success) {
      router.push(`/groups/${groupId}`)
    } else {
      setError(result.error || "Impossible de rejoindre")
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
      <Button onClick={handleJoin} loading={loading} className="w-full">
        Rejoindre ce groupe
      </Button>
    </div>
  )
}
