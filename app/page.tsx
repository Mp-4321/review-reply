import ReplyForm from './ui/reply-form'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            ✦ Powered by AI
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Reply<span className="text-blue-600">AI</span>
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Genera risposte professionali alle tue recensioni Google in pochi secondi.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/60 ring-1 ring-gray-100">
          <ReplyForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          ReplyAI · Le tue risposte, sempre al meglio
        </p>
      </div>
    </div>
  )
}
