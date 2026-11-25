import { useState } from "react"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarContent } from "./Sidebar"

export default function MobileNav({ active, onSelect, tasksCount }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full bg-accent-strong text-white shadow-sm shadow-accent-ink/20 transition-all hover:-translate-y-0.5 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 border-r border-white/70 p-0 text-ink backdrop-blur-2xl sm:max-w-xs"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgb(255 255 255 / 0.97) 0%, color-mix(in oklab, var(--color-accent-wash) 97%, white) 100%)",
          }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          <SidebarContent
            active={active}
            tasksCount={tasksCount}
            onSelect={(id) => {
              setOpen(false)
              // Wait for the drawer to finish closing, then navigate
              setTimeout(() => onSelect(id), 300)
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}