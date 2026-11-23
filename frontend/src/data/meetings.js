import { inMinutes } from "@/lib/dates"

export const meetings = [
  { id: "m0", title: "Internal standup", client: "Team", start: inMinutes(-180), durationMin: 15, participants: 6, link: "https://zoom.us/j/81234567890", featured: false },
  { id: "m1", title: "Weekly growth sync: Lakeside Dental", client: "Lakeside Dental", start: inMinutes(25), durationMin: 45, participants: 5, link: "https://zoom.us/j/82345678901", featured: true },
  { id: "m2", title: "Campaign review: Nova Skincare", client: "Nova Skincare", start: inMinutes(210), durationMin: 30, participants: 4, link: "https://zoom.us/j/83456789012", featured: false },
  { id: "m3", title: "Content calendar planning: Peak Fitness", client: "Peak Fitness", start: inMinutes(330), durationMin: 60, participants: 3, link: "https://zoom.us/j/84567890123", featured: false },
]