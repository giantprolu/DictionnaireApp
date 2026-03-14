"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { getProfile, updateProfile } from "@/lib/actions/auth"
import { signOut } from "next-auth/react"

const AVATAR_OPTIONS = ["😎", "🤓", "🧠", "🔥", "💀", "🎮", "🎯", "🤡", "👻", "🦊", "🐱", "🌙"]

interface Achievement {
  id: string
  unlockedAt: string
  achievement: { code: string; name: string; description: string; emoji: string }
}

interface UserProfile {
  id: string
  email: string
  username: string
  avatar: string | null
  bio: string | null
  createdAt: string
  achievements: Achievement[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("")

  useEffect(() => {
    async function load() {
      const result = await getProfile()
      if (result.success && result.data) {
        const data = result.data as unknown as UserProfile
        setProfile(data)
        setSelectedAvatar(data.avatar || "")
      }
    }
    load()
  }, [])

  if (!profile) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 rounded-xl bg-[#1C1C1F] animate-pulse" />
        <div className="h-40 rounded-xl bg-[#1C1C1F] animate-pulse" />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    formData.set("avatar", selectedAvatar)

    const result = await updateProfile(formData)
    if (result.success) {
      setSuccess("Profil mis a jour !")
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError(result.error || "Erreur")
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Mon profil</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl p-3 text-[#34D399] text-sm">{success}</div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#1C1C1F] border-2 border-[#2A2A2E] flex items-center justify-center text-4xl">
          {selectedAvatar || profile.username.slice(0, 2).toUpperCase()}
        </div>
        <p className="text-[#888] text-sm mt-2">{profile.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="username" label="Pseudo" defaultValue={profile.username} required />

        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio || ""}
            placeholder="Raconte ta life en 2 lignes..."
            className="w-full rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] px-4 py-3 text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399] resize-none"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedAvatar(emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  selectedAvatar === emoji
                    ? "bg-[#34D399]/20 ring-2 ring-[#34D399]"
                    : "bg-[#1C1C1F] hover:bg-[#2A2A2E]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">Enregistrer</Button>
      </form>

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-[#F5F5F5] mb-3">Badges</h2>
            <div className="grid grid-cols-2 gap-2">
              {profile.achievements.map((ua) => (
                <div
                  key={ua.id}
                  className="flex items-center gap-2 bg-[#0A0A0B] rounded-lg p-2"
                >
                  <span className="text-2xl">{ua.achievement.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#F5F5F5]">{ua.achievement.name}</p>
                    <p className="text-[10px] text-[#888]">{ua.achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        Se deconnecter
      </Button>

      <p className="text-center text-xs text-[#888]">
        Membre depuis {new Date(profile.createdAt).toLocaleDateString("fr-FR")}
      </p>
    </div>
  )
}
