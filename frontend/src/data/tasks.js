import { addDays } from "@/lib/dates"
import { getMember } from "./team"

// priority: low | medium | high | urgent
export const tasks = [
  { id: "t1", title: "Edit 30s product reel for Nova Skincare", service: "Video Production", due: addDays(-1), priority: "urgent", done: false, assignee: getMember("sara") },
  { id: "t2", title: "Publish this week's GMB posts for Lakeside Dental", service: "GMB", due: addDays(0), priority: "high", done: false, assignee: getMember("bilal") },
  { id: "t3", title: "Fix schema markup and internal links on the Brightpath Tutors site", service: "SEO", due: addDays(0), priority: "high", done: false, assignee: getMember("omar") },
  { id: "t4", title: "Write LinkedIn carousel script: 5 mistakes in local SEO", service: "Content Creation", due: addDays(0), priority: "medium", done: false, assignee: getMember("liya") },
  { id: "t5", title: "Send monthly performance report to Urban Brew Café", service: "SEO", due: addDays(-2), priority: "high", done: false, assignee: getMember("bilal") },
  { id: "t6", title: "Test 3 new video hooks for the Peak Fitness Meta campaign", service: "Paid Ads", due: addDays(1), priority: "medium", done: false, assignee: getMember("dev") },
  { id: "t7", title: "Schedule 12 Instagram Reels for next week", service: "Social Media", due: addDays(1), priority: "low", done: false, assignee: getMember("nina") },
  { id: "t8", title: "Keyword research for Greenleaf Landscaping's service pages", service: "SEO", due: addDays(3), priority: "low", done: false, assignee: getMember("omar") },
  { id: "t9", title: "Color-grade the Lakeside Dental testimonial video", service: "Video Production", due: addDays(2), priority: "medium", done: false, assignee: getMember("sara") },
  { id: "t10", title: "Approve final brand kit with Nova Skincare", service: "Content Creation", due: addDays(0), priority: "medium", done: true, assignee: getMember("bilal") },
]