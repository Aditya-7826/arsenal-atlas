import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation, Link } from 'react-router'
import { ModeProvider } from './mode'
import { TopBar } from './components/TopBar'
import { GlassPanel } from './components/GlassPanel'

// Every route is its own chunk; three.js is only pulled in by the lobby and viewer.
const Lobby = lazy(() => import('./pages/Lobby'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const FirearmPage = lazy(() => import('./pages/FirearmPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const CreditsPage = lazy(() => import('./pages/CreditsPage'))

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status">
      <span className="label">Loading…</span>
    </div>
  )
}

function NotFound() {
  return (
    <GlassPanel className="mx-auto mt-10 max-w-lg p-8 text-center" stagger={0}>
      <h1 className="font-display text-2xl">NOT IN THE COLLECTION</h1>
      <p className="mt-3 text-muted">That page does not exist.</p>
      <Link to="/" className="btn mt-6">Back to the lobby</Link>
    </GlassPanel>
  )
}

function Shell() {
  const loc = useLocation()
  // move focus to the main region on navigation for keyboard and screen-reader users
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [loc.pathname])
  return (
    <div className="min-h-dvh md:p-6">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <GlassPanel frame className="flex min-h-dvh flex-col rounded-none md:min-h-[calc(100dvh-3rem)] md:rounded-[24px]">
        <TopBar />
        <main id="main" tabIndex={-1} className="flex-1 p-3 outline-none sm:p-4 md:p-6">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </GlassPanel>
      <ScrollRestoration />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Lobby /> },
      { path: '/category/:slug', element: <CategoryPage /> },
      { path: '/firearm/:id', element: <FirearmPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/credits', element: <CreditsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <ModeProvider>
      <RouterProvider router={router} />
    </ModeProvider>
  )
}
