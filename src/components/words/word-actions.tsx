"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteWord } from "@/lib/actions/words"

interface Props {
  wordId: string
  groupId: string
}

export function WordActions({ wordId, groupId }: Props) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Supprimer ce mot et toutes ses definitions ?")) return
    setLoading(true)
    const result = await deleteWord(wordId)
    if (result.success) {
      router.push(`/groups/${groupId}`)
    }
    setLoading(false)
  }

  async function handleShare() {
    const url = `${window.location.origin}/groups/${groupId}/words/${wordId}`
    if (navigator.share) {
      await navigator.share({ title: "Val'tionnaire", url })
    } else {
      await navigator.clipboard.writeText(url)
      alert("Lien copie !")
    }
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-[#2A2A2E] transition-colors"
        disabled={loading}
      >
        <svg className="w-5 h-5 text-[#888]" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl shadow-lg min-w-[140px] overflow-hidden">
            <button
              onClick={handleShare}
              className="w-full px-4 py-2.5 text-left text-sm text-[#F5F5F5] hover:bg-[#2A2A2E] transition-colors"
            >
              Partager
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  )
}
