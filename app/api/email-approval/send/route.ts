import { auth } from '@clerk/nextjs/server'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { Resend } from 'resend'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

const resend = new Resend(process.env.RESEND_API_KEY)

const RATING_NUM: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }

function stars(rating: string) {
  const n = RATING_NUM[rating] ?? 3
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

function emailHtml({
  reviewerName,
  starRating,
  comment,
  draft,
  approveUrl,
  rejectUrl,
  dashboardUrl,
}: {
  reviewerName: string
  starRating:   string
  comment:      string | null
  draft:        string
  approveUrl:   string
  rejectUrl:    string
  dashboardUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#1e293b;padding:24px 32px;">
          <p style="margin:0;color:#f8fafc;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Replyfier</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">New draft reply ready for approval</p>
        </td></tr>

        <!-- Review section -->
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Customer review</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#0f172a;">${reviewerName}</p>
            <p style="margin:0 0 10px;font-size:15px;color:#f59e0b;letter-spacing:1px;">${stars(starRating)}</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">${comment ?? '<em>No comment left.</em>'}</p>
          </div>
        </td></tr>

        <!-- Draft section -->
        <tr><td style="padding:20px 32px 0;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">AI draft reply</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#1e40af;">${draft}</p>
          </div>
        </td></tr>

        <!-- Action buttons -->
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" align="center">
                <a href="${approveUrl}" style="display:block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 24px;border-radius:10px;text-align:center;">
                  ✓ &nbsp;Approve &amp; Queue
                </a>
              </td>
              <td width="4%"></td>
              <td width="48%" align="center">
                <a href="${rejectUrl}" style="display:block;background:#ffffff;color:#dc2626;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-align:center;border:1.5px solid #fca5a5;">
                  ✕ &nbsp;Reject
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #f1f5f9;padding:20px 32px;text-align:center;">
          <a href="${dashboardUrl}" style="color:#6366f1;font-size:12px;text-decoration:none;">Edit in dashboard →</a>
          <p style="margin:10px 0 0;font-size:11px;color:#cbd5e1;">This link expires in 7 days. Sent by Replyfier.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: Request) {
  try {
    const { getToken } = await auth()
    const convexToken = await getToken({ template: 'convex' })
    if (!convexToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { replyId } = await request.json() as { replyId: string }
    if (!replyId) return Response.json({ error: 'Missing replyId' }, { status: 400 })

    const data = await fetchQuery(
      api.emailApproval.getEmailData,
      { replyId: replyId as Id<'replies'> },
      { token: convexToken },
    )
    if (!data) return Response.json({ error: 'Reply not found' }, { status: 404 })
    if (!data.userEmail) return Response.json({ error: 'No email on file for user' }, { status: 422 })
    if (data.reply.status !== 'draft') return Response.json({ ok: true, skipped: 'not_draft' })

    const token = await fetchMutation(
      api.emailApproval.setToken,
      { replyId: replyId as Id<'replies'> },
      { token: convexToken },
    )

    const origin      = new URL(request.url).origin
    const approveUrl  = `${origin}/api/email-approval/approve?token=${token}`
    const rejectUrl   = `${origin}/api/email-approval/reject?token=${token}`
    const dashboardUrl = `${origin}/dashboard/inbox?reviewId=${data.review._id}`

    await resend.emails.send({
      from:    'Replyfier <support@replyfier.com>',
      to:      data.userEmail,
      subject: `New reply ready for approval — ${data.review.reviewerName}`,
      html:    emailHtml({
        reviewerName: data.review.reviewerName,
        starRating:   data.review.starRating,
        comment:      data.review.comment ?? null,
        draft:        data.reply.draft,
        approveUrl,
        rejectUrl,
        dashboardUrl,
      }),
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[email-approval/send]', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
