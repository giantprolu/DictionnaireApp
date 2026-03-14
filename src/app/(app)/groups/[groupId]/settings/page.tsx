"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { getGroup, updateGroup, deleteGroup } from "@/lib/actions/groups"

const EMOJI_OPTIONS = ["📖", "🔥", "💀", "🎮", "🍕", "🎉", "💬", "🤡", "❤️", "⚡", "🎯", "🌙"]
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dictionnaire.trouve-tout-conseil.fr"

export default function GroupSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("📖")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getGroup(groupId)
      if (result.success && result.data) {
        setGroup(result.data)
        setSelectedEmoji((result.data.emoji as string) || "📖")
      }
    }
    load()
  }, [groupId])

  if (!group) {
    return <div className="p-4"><div className="h-40 rounded-xl bg-[#1C1C1F] animate-pulse" /></div>
  }

  const inviteLink = `${APP_URL}/join/${group.code}`

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    formData.set("emoji", selectedEmoji)

    const result = await updateGroup(groupId, formData)
    if (result.success) {
      setSuccess("Groupe mis a jour !")
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError(result.error || "Erreur")
    }
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const result = await deleteGroup(groupId)
    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Erreur lors de la suppression")
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: `Rejoins ${group!.name} sur DicoCrew !`,
        text: `Viens ajouter des mots dans notre dico !`,
        url: inviteLink,
      })
    } else {
      copyToClipboard(inviteLink)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#F5F5F5]">Parametres</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl p-3 text-[#34D399] text-sm">{success}</div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleUpdate} className="space-y-4">
        <Input name="name" label="Nom" defaultValue={group.name as string} required />
        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Description</label>
          <textarea
            name="description"
            defaultValue={(group.description as string) || ""}
            className="w-full rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] px-4 py-3 text-[#F5F5F5] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#34D399] resize-none"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Emoji</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  selectedEmoji === emoji
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

      {/* Invite Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-[#F5F5F5]">Invitation</h2>

          <div>
            <label className="text-sm text-[#888]">Code</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-[#0A0A0B] rounded-lg px-4 py-2 font-mono text-lg text-[#34D399] tracking-widest text-center">
                {group.code as string}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(group.code as string)}>
                {copied ? "Copie !" : "Copier"}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#888]">Lien</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-[#0A0A0B] rounded-lg px-3 py-2 text-sm text-[#888] truncate border border-[#2A2A2E]"
              />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(inviteLink)}>
                Copier
              </Button>
            </div>
          </div>

          <div className="flex justify-center py-2">
            <QRCodeSVG value={inviteLink} size={160} bgColor="#1C1C1F" fgColor="#F5F5F5" />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleShare}>
            Partager
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20">
        <CardContent className="p-4">
          <h2 className="font-semibold text-red-400 mb-3">Zone de danger</h2>
          <Button variant="danger" className="w-full" onClick={() => setShowDeleteModal(true)}>
            Supprimer le groupe
          </Button>
        </CardContent>
      </Card>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer le groupe ?">
        <p className="text-[#888] mb-4">
          Cette action est irreversible. Tous les mots, definitions et commentaires seront supprimes.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" className="flex-1" loading={loading} onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  )
}
