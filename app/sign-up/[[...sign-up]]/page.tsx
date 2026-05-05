import { SignUp } from '@clerk/nextjs'
import Navbar from '../../ui/navbar'

const FEATURES = [
  'Automatically sync all your Google reviews in one place',
  'Respond instantly in your brand voice',
  'Get email alerts as soon as new reviews come in',
  'Post replies directly to Google in one click',
]

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 pt-14 lg:flex-row lg:items-start lg:gap-16 lg:pt-32">

        {/* Left — value proposition */}
        <div className="flex-1 text-center lg:text-left lg:pt-3">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Respond to every customer review<br />in seconds with AI
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Create an account and start your 7-day free trial.
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
