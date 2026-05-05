import { SignUp } from '@clerk/nextjs'
import Navbar from '../../ui/navbar'

const FEATURES = [
  'AI-generated review replies with your favourite tone',
  'Google Business review sync',
  'Email alerts for new reviews',
  'Review before sending',
  'Publish to Google without copy-paste',
]

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 pt-14 lg:flex-row lg:items-center lg:gap-16">

        {/* Left — value proposition */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Start replying to reviews<br className="hidden lg:block" /> in seconds
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Create your account and start your 7-day free trial today.
          </p>
          <ul className="mt-8 space-y-3 text-left">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 text-green-500 font-bold text-lg leading-none">✓</span>
                <span className="text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Clerk SignUp */}
        <div className="flex justify-center lg:justify-end lg:pl-8">
          <SignUp />
        </div>

      </div>
    </div>
  )
}
