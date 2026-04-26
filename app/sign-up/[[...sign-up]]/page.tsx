import { SignUp } from '@clerk/nextjs'
import Navbar from '../../ui/navbar'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-6 pt-14">
        <SignUp />
      </div>
    </div>
  )
}
