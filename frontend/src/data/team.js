export const team = [
  { id: "bilal", name: "Bilal Ahmed", role: "Digital Strategist", status: "online", avatar: "" },
  { id: "sarin", name: "Sarin", role: "Developer", status: "meeting", avatar: "" },
  { id: "anandh", name: "Anandh", role: "Graphics Designer", status: "online", avatar: "" },
  { id: "prabhitha", name: "Prabhitha", role: "Content Strategist", status: "away", avatar: "" },
  { id: "aravind", name: "Aravind", role: "Graphics Design Intern", status: "online", avatar: "" },
  { id: "anushree", name: "Anushree", role: "SEO Specialist", status: "meeting", avatar: "" },
  { id: "afsal", name: "Afsal", role: "Web Intern", status: "online", avatar: "" },
]

export const currentUser = team[0]

export const getMember = (id) => team.find((m) => m.id === id)

export const getInitials = (name) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()