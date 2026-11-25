import { useState } from "react"
import GlassCard from "@/components/layout/GlassCard"
import { celebrate } from "@/lib/confetti"
import { cn } from "@/lib/utils"
import { focusRing } from "@/lib/glass"
import PostSlider from "./PostSlider"
import TeamRoster from "./TeamRoster"
import { Share2 } from "lucide-react"

const TABS = [
  { id: "queue", label: "Socials queue" },
  { id: "team", label: "Team" },
]

export default function SocialColumn({ posts: initialPosts, team, currentUserId }) {
  // Approvals only matter in this column, so the state lives here
  const [posts, setPosts] = useState(initialPosts)
  const [tab, setTab] = useState("queue")

  const awaiting = posts.filter((p) => !p.approved).length
  const online = team.filter((m) => m.status === "online").length

  const approvePost = (id, event) => {
    celebrate(event)
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, approved: true } : p)))
  }

  return (
    <GlassCard
      title="Socials & team"
      tone="soft"
icon={Share2}
      description={
        tab === "queue"
          ? awaiting === 0
            ? "Everything is approved 🎉"
            : `${awaiting} awaiting approval`
          : `${online} of ${team.length} online`
      }
    >
      <div className="space-y-4">
        {/* Segmented switcher */}
        <div
          role="tablist"
          aria-label="Socials or team"
          className="grid grid-cols-2 gap-1 rounded-full bg-accent-ink/5 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                focusRing,
                tab === t.id
                  ? "bg-accent-strong text-white shadow-sm shadow-accent-ink/20"
                  : "text-ink-muted hover:bg-accent-soft/70 hover:text-accent-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "queue" ? (
          <PostSlider posts={posts} onApprove={approvePost} />
        ) : (
          <TeamRoster members={team} currentUserId={currentUserId} />
        )}
      </div>
    </GlassCard>
  )
}