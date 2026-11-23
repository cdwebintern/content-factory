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
        className="grid h-10 w-10 place-items-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 border-r border-white/70 p-0 text-neutral-900 backdrop-blur-2xl sm:max-w-xs"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(240,245,236,0.97) 100%)",
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