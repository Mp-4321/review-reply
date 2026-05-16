import { fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

function page(title: string, body: string, color: string) {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Replyfier</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;max-width:400px;padding:40px 24px;">
    <div style="font-size:48px;margin-bottom:16px;">${color === 'green' ? '✅' : '❌'}</div>
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">${title}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${body}</p>
    <a href="/dashboard/inbox" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;">Open Inbox →</a>
  </div>
</body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return page('Invalid link', 'This rejection link is missing a token.', 'red')

  try {
    const result = await fetchMutation(api.emailApproval.rejectByToken, { token })

    if (!result.ok) {
      if (result.reason === 'already_actioned') return page('Already actioned', 'This reply has already been approved or rejected.', 'red')
      if (result.reason === 'expired')          return page('Link expired', 'This rejection link has expired. Go to the dashboard to manage the reply.', 'red')
      return page('Not found', 'This rejection link is no longer valid.', 'red')
    }

    return page('Reply rejected', 'The draft has been discarded. You can generate a new one from the Inbox.', 'green')
  } catch (err) {
    console.error('[email-approval/reject]', err)
    return page('Something went wrong', 'Please try again or manage the reply from the dashboard.', 'red')
  }
}
