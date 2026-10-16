import { useEffect, useRef } from 'react'
import { Link, Route, Switch, useLocation } from 'wouter'
import { Header } from './components/Header'
import { StorageNotice } from './components/StorageNotice'
import { ConceptMap } from './routes/ConceptMap'
import { Explore, LearnIndex } from './routes/Catalog'
import { Home } from './routes/Home'
import { LessonPage } from './routes/LessonPage'
import { MyLearning } from './routes/MyLearning'
import { Practice } from './routes/Practice'
import { Tutor } from './routes/Tutor'
import { ForgotPasswordPage, LoginPage, RequireAuth, ResetPasswordPage, SignupPage } from './auth/AuthPages'
import { stopSpeech } from './tutor/speech'
import { Lesson } from './routes/Lesson'
import { Library } from './routes/Library'
import { Perspectives } from './routes/Perspectives'
import { Search } from './routes/Search'
import { Settings } from './routes/Settings'
import { Skills } from './routes/Skills'
import { usePageTitle } from './routes/usePageTitle'

function NotFound() {
  usePageTitle('Not found')
  return (
    <div className="page">
      <h1 className="display display--small">Not here</h1>
      <p className="lead">This page does not exist in Lumen.</p>
      <p>
        <Link href="/">Go to Today</Link> or <Link href="/search">search</Link>.
      </p>
    </div>
  )
}

export function App() {
  const [path] = useLocation()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)

  // On route change: start at the top and move focus to the new page, as a full page load would.
  useEffect(() => {
    // Never keep reading an answer aloud on another page.
    stopSpeech()
    if (first.current) {
      first.current = false
      return
    }
    if (!location.hash) scrollTo(0, 0)
    main.current?.focus({ preventScroll: true })
  }, [path])

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" ref={main} tabIndex={-1}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/learn" component={LearnIndex} />
          <Route path="/learn/mitochondrion" component={Lesson} />
          <Route path="/learn/:id">{(p) => <LessonPage key={p.id} id={p.id} />}</Route>
          <Route path="/tutor" component={Tutor} />
          <Route path="/practice" component={Practice} />
          <Route path="/my-learning">
            <RequireAuth>
              <MyLearning />
            </RequireAuth>
          </Route>
          <Route path="/map" component={ConceptMap} />
          <Route path="/library">
            <RequireAuth>
              <Library />
            </RequireAuth>
          </Route>
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/perspectives" component={Perspectives} />
          <Route path="/skills" component={Skills} />
          <Route path="/settings" component={Settings} />
          <Route path="/search" component={Search} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="site-footer">
        <p>Lumen · Lessons, practice and interview prep · Your progress is saved in this browser. No account, no tracking.</p>
        <p>
          <Link href="/learn">All lessons</Link> · <Link href="/library">Notes</Link> · <Link href="/perspectives">Debate</Link> · <Link href="/settings#storage">Your data</Link> · <Link href="/settings#faq">Questions</Link>
        </p>
      </footer>
      <StorageNotice />
    </>
  )
}
