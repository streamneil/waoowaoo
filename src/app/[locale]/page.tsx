'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import Navbar from '@/components/Navbar'
import { Link } from '@/i18n/navigation'
import { buildAuthenticatedHomeTarget } from '@/lib/home/default-route'
import HeroFilmFrame from '@/components/home/HeroFilmFrame'
import FilmstripLoader from '@/components/ui/FilmstripLoader'

export default function Home() {
  const t = useTranslations('landing')
  const tc = useTranslations('common')
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(buildAuthenticatedHomeTarget())
    }
  }, [status, router])

  if (status !== 'unauthenticated') {
    return (
      <div className="glass-page min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <FilmstripLoader />
          <p className="text-sm font-mono tracking-[0.3em] text-[var(--qy-ink-tertiary)]">
            {tc('appName').toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-page min-h-screen overflow-hidden font-sans selection:bg-[var(--qy-accent-soft)]">
      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Background — sunset & film-green warm radials, no blue glass */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_600px_at_85%_-10%,rgba(255,106,61,0.18),transparent_55%),radial-gradient(900px_520px_at_-5%_110%,rgba(47,74,63,0.14),transparent_55%)]" />
        {/* Soft projector light beam */}
        <div
          className="qy-projector-sweep absolute -top-40 -left-20 w-[680px] h-[120px] opacity-60"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,229,200,0.55) 50%, transparent 100%)',
            filter: 'blur(40px)',
            transform: 'rotate(-12deg)',
          }}
        />
        {/* Film grain veil */}
        <div className="qy-grain absolute inset-0" />
      </div>

      <main className="relative z-10">
        <section className="relative min-h-screen flex items-center justify-center -mt-16 px-4">
          <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div
              className="text-left space-y-8 animate-slide-up"
              style={{ animationDuration: '0.8s' }}
            >
              {/* Brand badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--qy-stroke-base)] bg-[var(--qy-surface)] text-[11px] font-mono font-semibold tracking-[0.2em] text-[var(--qy-ink-secondary)] animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--qy-accent)] qy-aperture-pulse" />
                AI · CINEMATIC · STUDIO
              </div>

              <h1
                className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] animate-fade-in"
                style={{ animationDelay: '0.2s', fontFamily: "'Source Han Serif SC', 'Songti SC', 'Noto Serif CJK SC', serif" }}
              >
                <span className="block text-[var(--qy-ink-primary)]">
                  {t('title')}
                </span>
                <span className="block mt-2 text-[var(--qy-accent)]">
                  {t('subtitle')}
                </span>
              </h1>

              <p
                className="text-lg text-[var(--qy-ink-secondary)] max-w-md leading-relaxed animate-fade-in"
                style={{ animationDelay: '0.45s' }}
              >
                {t('features.subtitle')}
              </p>

              <div
                className="flex flex-wrap gap-4 pt-4 animate-fade-in"
                style={{ animationDelay: '0.6s' }}
              >
                {/* 注册入口已隐藏：原为「立即体验」→ /auth/signup + 「进入工作区」→ /auth/signin；当前主 CTA 统一进登录 */}
                {/*
                <Link
                  href={{ pathname: '/auth/signup' }}
                  className="glass-btn-base glass-btn-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  {t('getStarted')}
                </Link>
                <Link
                  href={{ pathname: '/auth/signin' }}
                  className="glass-btn-base glass-btn-secondary px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  {t('enterWorkspace')}
                </Link>
                */}
                <Link
                  href={{ pathname: '/auth/signin' }}
                  className="glass-btn-base glass-btn-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  {t('getStarted')}
                </Link>
              </div>

              {/* Tagline rule */}
              <div
                className="flex items-center gap-3 pt-6 animate-fade-in"
                style={{ animationDelay: '0.85s' }}
              >
                <span className="block w-12 h-[2px] bg-[var(--qy-accent)]" />
                <span className="text-xs font-mono tracking-[0.3em] text-[var(--qy-ink-tertiary)]">
                  TEXT → STORYBOARD → FILM
                </span>
              </div>
            </div>

            <div
              className="relative hidden lg:flex items-center justify-center pt-4 animate-scale-in"
              style={{ animationDuration: '1s' }}
            >
              <HeroFilmFrame />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-[var(--qy-stroke-soft)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[var(--qy-ink-tertiary)]">
          <span className="font-mono tracking-[0.18em]">© {t('footer.copyright')}</span>
          <span className="font-mono tracking-[0.18em]">{tc('appName').toUpperCase()} · v0.5</span>
        </div>
      </footer>
    </div>
  )
}
