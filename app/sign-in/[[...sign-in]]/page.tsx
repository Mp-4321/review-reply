import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_left,#eaf4ff,#f4f9ff_25%,#fafcff_55%,white)]">
      <SignIn />
    </main>
  )
}
