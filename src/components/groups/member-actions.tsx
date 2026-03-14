"use client"

import { useState } from "react"
import { removeMember, promoteMember } from "@/lib/actions/groups"

interface Props {
  groupId: string
  userId: string
  currentRole: "ADMIN" | "MEMBER"
}

export function MemberActions({ groupId, userId, currentRole }: Props) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  async function handleRemove() {
    if (!confirm("Retirer ce membre du groupe ?")) return
    setLoading(true)
    await removeMember(groupId, userId)
    setLoading(false)
    setShowMenu(false)
  }

  async function handlePromote() {
    if (!confirm("Promouvoir ce membre admin ?")) return
    setLoading(true)
    await promoteMember(groupId, userId)
    setLoading(false)
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-[#2A2A2E] transition-colors"
        disabled={loading}
      >
        <svg className="w-4 h-4 text-[#888]" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#1C1C1F] border border-[#2A2A2E] rounded-xl shadow-lg min-w-[160px] overflow-hidden">
            {currentRole === "MEMBER" && (
              <button
                onClick={handlePromote}
                className="w-full px-4 py-2.5 text-left text-sm text-[#F5F5F5] hover:bg-[#2A2A2E] transition-colors"
              >
                Promouvoir admin
              </button>
            )}
            <button
              onClick={handleRemove}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Retirer du groupe
            </button>
          </div>
        </>
      )}
    </div>
  )
}
