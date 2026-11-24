import { useEffect } from "react"
import { useLocation } from "react-router"
import WelcomeHero from "@/components/hero/WelcomeHero"
import MeetingsPreview from "@/components/meetings/MeetingsPreview"
import NewsPulse from "@/components/news/NewsPulse"
import SocialColumn from "@/components/social/SocialColumn"
import TasksPreview from "@/components/tasks/TasksPreview"
import { useData } from "@/context/dataContext"
import { news } from "@/data/news"
import { posts } from "@/data/posts"
import { currentUser, team } from "@/data/team"
import { scrollToId } from "@/lib/scroll"

export default function Home() {
  const {
    tasks,
    meetings,
    stats,
    meetingsTodayCount,
    tasksStatus,
    meetingsStatus,
    toggleTask,
    cyclePriority,
  } = useData()

  // The sidebar's "Team" link sends us here with a section to scroll to
  const location = useLocation()
  const scrollTarget = location.state?.scrollTo
  useEffect(() => {
    if (scrollTarget) scrollToId(scrollTarget)
  }, [scrollTarget, location.key])

  return (
    <>
      <div id="overview" className="scroll-mt-20">
        <WelcomeHero user={currentUser} stats={stats} meetings={meetings} />
      </div>

      {/* One column until xl. Then tasks and meetings share the wide left side, socials on the right */}
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <div id="tasks" className="scroll-mt-20">
            <TasksPreview
              tasks={tasks}
              onToggle={toggleTask}
              onCyclePriority={cyclePriority}
              loadError={tasksStatus === "error"}
            />
          </div>
          <div id="meetings" className="scroll-mt-20">
            <MeetingsPreview meetings={meetings} loadError={meetingsStatus === "error"} />
          </div>
        </div>

        <div id="socials" className="min-w-0 scroll-mt-20">
          <SocialColumn posts={posts} team={team} currentUserId={currentUser.id} />
        </div>
      </div>

      <NewsPulse
        items={news}
        pending={stats.pending}
        meetingsToday={meetingsTodayCount}
        overdue={stats.overdue}
      />
    </>
  )
}