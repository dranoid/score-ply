import { Home, Search, Music, Menu, X } from "lucide-react"

interface SidebarProps {
  currentTrackTitle: string | null
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ currentTrackTitle, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile menu button - shown when sidebar is closed on mobile */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border md:hidden"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-40
          w-64 h-full border-r border-border bg-sidebar flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:transform-none
        `}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-8">
            <Music className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold">Scoreply</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-primary/10 text-accent hover:bg-sidebar-primary/20 transition-colors cursor-pointer">
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10 transition-colors cursor-pointer">
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 mb-2">Now Playing</div>
          <div className="text-sm font-medium text-sidebar-foreground/80 truncate">
            {currentTrackTitle || "No track loaded"}
          </div>
        </div>
      </aside>
    </>
  )
}
