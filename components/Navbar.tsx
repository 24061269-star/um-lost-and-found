export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-umblue" />
          <span className="text-lg font-semibold text-umblue">UM Lost & Found</span>
        </div>
        <div className="hidden flex-1 items-center justify-center sm:flex">
          <form action="/search" method="get" className="w-full max-w-md">
            <div className="relative">
              <input
                name="q"
                placeholder="Search items..."
                className="w-full rounded-xl border border-gray-300 px-3 py-2 pl-9 focus:border-umblue focus:outline-none"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            </div>
          </form>
        </div>
        <nav className="flex items-center gap-4 text-sm text-gray-700">
          <a className="rounded-xl px-3 py-1 hover:bg-umblue/5" href="/">Home</a>
          <a className="rounded-xl px-3 py-1 hover:bg-umblue/5" href="/lost">Lost</a>
          <a className="rounded-xl px-3 py-1 hover:bg-umblue/5" href="/found">Found</a>
          <a className="rounded-xl px-3 py-1 hover:bg-umblue/5" href="/post">Post</a>
          <a className="rounded-xl px-3 py-1 hover:bg-umblue/5" href="/my-items">My Items</a>
          <a className="rounded-xl px-3 py-1 hover:bg-umblue/5" href="/admin">Admin</a>
        </nav>
      </div>
    </header>
  );
}

