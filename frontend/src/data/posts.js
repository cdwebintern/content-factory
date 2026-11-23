import { addDays } from "@/lib/dates"

// platform: instagram | linkedin | youtube | x
export const posts = [
  { id: "p1", platform: "instagram", format: "Reel", client: "Nova Skincare", scheduledAt: addDays(0, 18), hook: "Stop wasting money on 5-step routines. Here's the only 2 you need 👇", approved: false },
  { id: "p2", platform: "linkedin", format: "Carousel", client: "Brightpath Tutors", scheduledAt: addDays(1, 9), hook: "5 mistakes killing your local SEO (and how to fix each in 10 minutes)", approved: false },
  { id: "p3", platform: "youtube", format: "Short", client: "Peak Fitness", scheduledAt: addDays(1, 12), hook: "I trained like this for 30 days. Here's what actually changed.", approved: false },
  { id: "p4", platform: "x", format: "Thread", client: "Urban Brew Café", scheduledAt: addDays(2, 10), hook: "We tested 12 cold brew recipes. Only one passed our blind test 🧵", approved: false },
  { id: "p5", platform: "instagram", format: "Reel", client: "Lakeside Dental", scheduledAt: addDays(2, 17), hook: "What your dentist wishes you knew about whitening strips", approved: false },
]