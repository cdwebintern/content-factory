import {
  LayoutDashboard, CheckSquare, Video, Users, Briefcase, BarChart3, Bot, Zap,
} from "lucide-react"

export const navGroups = [
  {
    title: "Focus & Work",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "tasks", label: "Tasks", icon: CheckSquare },
      { id: "meetings", label: "Meetings", icon: Video },
      { id: "team", label: "Team", icon: Users },
      { id: "clients", label: "Clients", icon: Briefcase },
      { id: "reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "AI & Automation",
    items: [
      { id: "ai-workforce", label: "AI Workforce", icon: Bot },
      { id: "automations", label: "Automations", icon: Zap },
    ],
  },
]

export const serviceTags = [
  "SEO", "Video Production", "Content Creation", "GMB", "Social Media", "Paid Ads", "Web Design",
]