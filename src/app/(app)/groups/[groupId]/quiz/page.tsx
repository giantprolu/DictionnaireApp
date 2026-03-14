"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface QuizQuestion {
  word: string
  correctDefinition: string
  options: string[]
  correctIndex: number
}

export default function QuizPage() {
  const params = useParams()
  const groupId = params.groupId as string
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadQuiz = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quiz/${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data)
      }
    } catch {
      // Quiz load failed
    }
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  function handleSelect(index: number) {
    if (selected !== null) return
    setSelected(index)
    if (index === questions[currentIndex].correctIndex) {
      setScore((s) => s + 1)
    }
    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        setFinished(true)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelected(null)
      }
    }, 1500)
  }

  function restart() {
    setCurrentIndex(0)
    setScore(0)
    setSelected(null)
    setFinished(false)
    loadQuiz()
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-60 rounded-xl bg-[#1C1C1F] animate-pulse" />
      </div>
    )
  }

  if (questions.length < 2) {
    return (
      <div className="p-4 text-center py-20">
        <div className="text-5xl mb-4">🎮</div>
        <h1 className="text-xl font-bold text-[#F5F5F5] mb-2">Pas assez de mots</h1>
        <p className="text-[#888]">Il faut au moins 4 mots avec des definitions pour jouer au quiz !</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="p-4 text-center py-12">
        <div className="text-6xl mb-4">
          {score === questions.length ? "🏆" : score > questions.length / 2 ? "🎉" : "😅"}
        </div>
        <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">
          {score}/{questions.length}
        </h1>
        <p className="text-[#888] mb-6">
          {score === questions.length
            ? "Parfait ! Tu connais ton dico par coeur !"
            : score > questions.length / 2
            ? "Pas mal ! Tu geres !"
            : "Il faut reviser ton vocabulaire..."}
        </p>
        <Button onClick={restart}>Rejouer</Button>
      </div>
    )
  }

  const question = questions[currentIndex]

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#F5F5F5]">Quiz</h1>
        <span className="text-sm text-[#888]">
          {currentIndex + 1}/{questions.length} · Score: {score}
        </span>
      </div>

      <Card className="bg-gradient-to-r from-[#A78BFA]/10 to-[#34D399]/10 border-[#A78BFA]/20">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-[#888] uppercase tracking-wider mb-2">Quelle est la definition de...</p>
          <p className="text-3xl font-mono font-bold text-[#F5F5F5]">{question.word}</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          let className = "w-full text-left p-4 rounded-xl border text-sm transition-all "
          if (selected === null) {
            className += "bg-[#1C1C1F] border-[#2A2A2E] hover:border-[#34D399]/30 text-[#F5F5F5]"
          } else if (i === question.correctIndex) {
            className += "bg-[#34D399]/20 border-[#34D399] text-[#34D399]"
          } else if (i === selected) {
            className += "bg-red-500/20 border-red-500 text-red-400"
          } else {
            className += "bg-[#1C1C1F] border-[#2A2A2E] text-[#888] opacity-50"
          }

          return (
            <button key={i} onClick={() => handleSelect(i)} className={className} disabled={selected !== null}>
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
