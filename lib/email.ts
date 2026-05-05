import { Resend } from 'resend'
import { createServiceClient } from './supabase/server'

const FROM = process.env.EMAIL_FROM ?? 'גיוס חב"ד <noreply@giuus.vercel.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app'

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

async function getEmailByProfileId(profileId: string): Promise<string | null> {
  const service = createServiceClient()
  const { data } = await service.auth.admin.getUserById(profileId)
  return data.user?.email ?? null
}

function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F2F0F8;font-family:Arial,Helvetica,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0F8;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
        <!-- header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4B2E83,#5B3AAB);padding:28px 32px;text-align:center">
            <div style="color:#F8D877;font-size:22px;font-weight:700;letter-spacing:1px">גיוס והשמה</div>
            <div style="color:#d8ccf5;font-size:13px;margin-top:4px">מערכת ניהול גיוס מורות — רשת אהלי יוסף יצחק</div>
          </td>
        </tr>
        <!-- body -->
        <tr>
          <td style="padding:32px;color:#1a1a2e;font-size:15px;line-height:1.7">
            ${body}
          </td>
        </tr>
        <!-- footer -->
        <tr>
          <td style="background:#F2F0F8;padding:16px 32px;text-align:center;font-size:12px;color:#888">
            מערכת גיוס חב"ד · <a href="${APP_URL}" style="color:#5B3AAB;text-decoration:none">giuus.vercel.app</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, href: string): string {
  return `<div style="text-align:center;margin:24px 0">
    <a href="${href}" style="display:inline-block;background:#4B2E83;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">${text}</a>
  </div>`
}

// ── Application accepted ──────────────────────────────────────────────
export async function sendApplicationAccepted(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#e8f5e9;border-right:4px solid #4CAF50;padding:12px 16px;border-radius:6px;color:#2e7d32">
      🎉 ברכות! <strong>התקבלת</strong> למשרת &ldquo;${opts.jobTitle}&rdquo; ב${opts.institutionName}.
    </p>
    <p>נציג מהמוסד יצור איתך קשר בקרוב לתיאום הפרטים.</p>
    ${btn('כניסה לדשבורד', `${APP_URL}/dashboard`)}
    <p style="font-size:13px;color:#888">מאחלים לך המון הצלחה בתפקיד החדש! 🌟</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `✅ התקבלת למשרת "${opts.jobTitle}" — ${opts.institutionName}`,
    html: baseHtml('התקבלת למשרה', body),
  }).catch(e => console.error('[EMAIL] accepted:', e))
}

// ── Application rejected ──────────────────────────────────────────────
export async function sendApplicationRejected(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p>תודה רבה על עניינך במשרת &ldquo;${opts.jobTitle}&rdquo; ב${opts.institutionName}.</p>
    <p>לאחר בחינת כל המועמדות, לצערנו לא נמצאה התאמה הפעם.</p>
    <p>אנו ממשיכות לחפש עבורך משרות מתאימות — בדקי את המשרות הפתוחות הנוספות:</p>
    ${btn('לצפייה במשרות פתוחות', `${APP_URL}/jobs`)}
    <p style="font-size:13px;color:#888">מאחלים לך הצלחה רבה!</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `עדכון על הגשתך ל"${opts.jobTitle}"`,
    html: baseHtml('עדכון על הגשה', body),
  }).catch(e => console.error('[EMAIL] rejected:', e))
}

// ── Invitation to interview ───────────────────────────────────────────
export async function sendInvitationEmail(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
  scheduledAt?: string | null
  message?: string | null
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const dt = opts.scheduledAt
    ? new Date(opts.scheduledAt).toLocaleString('he-IL', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#ede7f6;border-right:4px solid #5B3AAB;padding:12px 16px;border-radius:6px">
      📩 <strong>${opts.institutionName}</strong> מזמינה אותך לראיון למשרת &ldquo;${opts.jobTitle}&rdquo;.
    </p>
    ${dt ? `<p><strong>מועד מוצע:</strong> ${dt}</p>` : ''}
    ${opts.message ? `<p><strong>הודעה מהמוסד:</strong><br/>${opts.message}</p>` : ''}
    <p>ניתן לאשר או לסרב להזמנה מהדשבורד שלך:</p>
    ${btn('לצפייה בהזמנה', `${APP_URL}/my-invitations`)}
    <p style="font-size:13px;color:#888">אנא הגיבי להזמנה בהקדם האפשרי.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `📩 הוזמנת לראיון — ${opts.institutionName}`,
    html: baseHtml('הזמנה לראיון', body),
  }).catch(e => console.error('[EMAIL] invitation:', e))
}

// ── Interview scheduled ───────────────────────────────────────────────
export async function sendInterviewScheduledEmail(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
  scheduledAt: string
  location?: string | null
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const dt = new Date(opts.scheduledAt).toLocaleString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#e3f2fd;border-right:4px solid #1976D2;padding:12px 16px;border-radius:6px">
      🗓 <strong>ראיון נקבע</strong> — ${opts.institutionName} · &ldquo;${opts.jobTitle}&rdquo;
    </p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#f5f5f5;border-radius:6px 0 0 6px;font-weight:600;width:100px">תאריך</td>
          <td style="padding:8px 12px;background:#fafafa">${dt}</td></tr>
      ${opts.location ? `<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">מיקום</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.location}</td></tr>` : ''}
    </table>
    ${btn('לדשבורד שלי', `${APP_URL}/dashboard`)}
    <p style="font-size:13px;color:#888">בהצלחה בראיון! 🌟</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `🗓 ראיון נקבע — ${opts.institutionName} (${dt})`,
    html: baseHtml('ראיון נקבע', body),
  }).catch(e => console.error('[EMAIL] interview scheduled:', e))
}

// ── Invitation reminder (3 days no response) ─────────────────────────
export async function sendInvitationReminderEmail(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
  scheduledAt?: string | null
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const dt = opts.scheduledAt
    ? new Date(opts.scheduledAt).toLocaleString('he-IL', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#fff8e1;border-right:4px solid #F9A825;padding:12px 16px;border-radius:6px">
      ⏰ <strong>תזכורת:</strong> טרם הגבת להזמנה לראיון מ-<strong>${opts.institutionName}</strong>.
    </p>
    <p>ההזמנה למשרת &ldquo;${opts.jobTitle}&rdquo; ממתינה לתגובה שלך.</p>
    ${dt ? `<p><strong>מועד מוצע:</strong> ${dt}</p>` : ''}
    <p>אנא הגיבי בהקדם — ההזמנה תפוג אוטומטית תוך ימים ספורים.</p>
    ${btn('לצפייה בהזמנה', `${APP_URL}/my-invitations`)}
    <p style="font-size:13px;color:#888">לאישור או סירוב, היכנסי לדשבורד שלך.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `⏰ תזכורת: הזמנה לראיון ממתינה לתגובה — ${opts.institutionName}`,
    html: baseHtml('תזכורת: הזמנה לראיון', body),
  }).catch(e => console.error('[EMAIL] invitation-reminder:', e))
}

// ── Weekly admin summary ──────────────────────────────────────────────
export async function sendWeeklySummaryEmail(opts: {
  adminEmail: string
  adminName: string
  stats: {
    newApplications: number
    upcomingInterviews: number
    pendingInvitations: number
    newJobs: number
    newCandidates: number
    pendingApplications: number
  }
}) {
  const { stats } = opts

  const row = (label: string, value: number, color: string) =>
    `<tr>
      <td style="padding:10px 16px;border-bottom:1px solid #eee;font-size:15px">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:center">
        <span style="background:${color}18;color:${color};font-weight:700;font-size:17px;padding:2px 10px;border-radius:20px">${value}</span>
      </td>
    </tr>`

  const body = `
    <p>שלום <strong>${opts.adminName}</strong>,</p>
    <p>הנה סיכום פעילות המערכת לשבוע האחרון:</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;margin:16px 0">
      <thead>
        <tr style="background:#4B2E83">
          <th style="padding:10px 16px;color:#fff;text-align:right;font-size:14px">נושא</th>
          <th style="padding:10px 16px;color:#fff;text-align:center;font-size:14px">כמות</th>
        </tr>
      </thead>
      <tbody>
        ${row('הגשות חדשות השבוע', stats.newApplications, '#4CAF50')}
        ${row('ראיונות קרובים (7 ימים)', stats.upcomingInterviews, '#1976D2')}
        ${row('הזמנות ממתינות לתגובה', stats.pendingInvitations, '#F9A825')}
        ${row('הגשות ממתינות לטיפול', stats.pendingApplications, '#E53935')}
        ${row('משרות חדשות השבוע', stats.newJobs, '#5B3AAB')}
        ${row('מועמדות חדשות השבוע', stats.newCandidates, '#00B4CC')}
      </tbody>
    </table>
    ${btn('כניסה לדשבורד ניהול', `${APP_URL}/admin`)}
    <p style="font-size:13px;color:#888">סיכום אוטומטי שבועי — מערכת גיוס חב"ד.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: opts.adminEmail,
    subject: `📊 סיכום שבועי — מערכת גיוס חב"ד`,
    html: baseHtml('סיכום שבועי', body),
  }).catch(e => console.error('[EMAIL] weekly-summary:', e))
}

// ── Stale application admin alert ────────────────────────────────────
export async function sendStaleApplicationsEmail(opts: {
  adminEmail: string
  adminName: string
  applications: Array<{
    candidateName: string
    jobTitle: string
    institutionName: string
    daysOld: number
  }>
}) {
  const rows = opts.applications.map(a =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.candidateName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.jobTitle}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.institutionName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">
        <span style="color:#E53935;font-weight:700">${a.daysOld} ימים</span>
      </td>
    </tr>`
  ).join('')

  const body = `
    <p>שלום <strong>${opts.adminName}</strong>,</p>
    <p style="background:#fce4e4;border-right:4px solid #E53935;padding:12px 16px;border-radius:6px">
      ⚠️ נמצאו <strong>${opts.applications.length} הגשות</strong> שממתינות לטיפול מוסד מעל 3 ימים.
    </p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;margin:16px 0;font-size:14px">
      <thead>
        <tr style="background:#4B2E83">
          <th style="padding:8px 12px;color:#fff;text-align:right">מועמדת</th>
          <th style="padding:8px 12px;color:#fff;text-align:right">משרה</th>
          <th style="padding:8px 12px;color:#fff;text-align:right">מוסד</th>
          <th style="padding:8px 12px;color:#fff;text-align:center">המתנה</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${btn('לדשבורד ניהול', `${APP_URL}/admin`)}
    <p style="font-size:13px;color:#888">מומלץ לפנות למוסדות ולזרז טיפול בהגשות.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: opts.adminEmail,
    subject: `⚠️ ${opts.applications.length} הגשות ממתינות לטיפול — נדרש מעקב`,
    html: baseHtml('הגשות ממתינות לטיפול', body),
  }).catch(e => console.error('[EMAIL] stale-applications:', e))
}

// ── New job match notification ────────────────────────────────────────
export async function sendNewJobMatchEmail(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
  city: string
  jobId: string
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#e8eaf6;border-right:4px solid #5B3AAB;padding:12px 16px;border-radius:6px">
      ✨ נפתחה <strong>משרה חדשה</strong> שעשויה להתאים לך!
    </p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:120px">משרה</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.jobTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">מוסד</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.institutionName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">עיר</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.city}</td></tr>
    </table>
    ${btn('לצפייה במשרה', `${APP_URL}/jobs`)}
    <p style="font-size:13px;color:#888">זו התאמה שנמצאה עבורך אוטומטית לפי הפרופיל שלך.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `✨ משרה חדשה מתאימה לך — ${opts.jobTitle} | ${opts.institutionName}`,
    html: baseHtml('משרה חדשה התאמה', body),
  }).catch(e => console.error('[EMAIL] new-job-match:', e))
}

// ── New application → notify institution ─────────────────────────────
export async function sendNewApplicationEmail(opts: {
  institutionProfileId: string
  candidateName: string
  jobTitle: string
}) {
  const email = await getEmailByProfileId(opts.institutionProfileId)
  if (!email) return

  const body = `
    <p style="background:#e8eaf6;border-right:4px solid #5B3AAB;padding:12px 16px;border-radius:6px">
      📋 <strong>הגשה חדשה</strong> התקבלה למשרת &ldquo;${opts.jobTitle}&rdquo;
    </p>
    <p><strong>${opts.candidateName}</strong> הגישה מועמדות למשרה שלכם. לצפייה בפרטים ולמענה להגשה:</p>
    ${btn('לצפייה בהגשה', `${APP_URL}/institution/applications`)}
    <p style="font-size:13px;color:#888">מומלץ להגיב תוך 48 שעות.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `📋 הגשה חדשה — ${opts.candidateName} | ${opts.jobTitle}`,
    html: baseHtml('הגשה חדשה', body),
  }).catch(e => console.error('[EMAIL] new-application:', e))
}

// ── Application viewed → notify candidate ────────────────────────────
export async function sendApplicationViewedEmail(opts: {
  candidateProfileId: string
  jobTitle: string
  institutionName: string
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const body = `
    <p style="background:#e8f5e9;border-right:4px solid #4CAF50;padding:12px 16px;border-radius:6px">
      👁 <strong>${opts.institutionName}</strong> עיינה בהגשתך למשרת &ldquo;${opts.jobTitle}&rdquo;.
    </p>
    <p>זהו סימן טוב — המוסד מעיין במועמדות. נעדכן אותך בכל התפתחות.</p>
    ${btn('לצפייה בהגשות שלי', `${APP_URL}/my-applications`)}
    <p style="font-size:13px;color:#888">בהצלחה! 🌟</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `👁 ההגשה שלך נצפתה — ${opts.institutionName}`,
    html: baseHtml('ההגשה שלך נצפתה', body),
  }).catch(e => console.error('[EMAIL] application-viewed:', e))
}

// ── Institution approved ──────────────────────────────────────────────
export async function sendInstitutionApprovedEmail(opts: {
  institutionProfileId: string
  institutionName: string
}) {
  const email = await getEmailByProfileId(opts.institutionProfileId)
  if (!email) return

  const body = `
    <p style="background:#e8f5e9;border-right:4px solid #4CAF50;padding:12px 16px;border-radius:6px;color:#2e7d32">
      ✅ מוסד <strong>${opts.institutionName}</strong> אושר בהצלחה במערכת גיוס חב&quot;ד!
    </p>
    <p>כעת ניתן להיכנס למערכת ולפרסם משרות, לגלוש בין המועמדות ולהתחיל בתהליכי גיוס.</p>
    ${btn('כניסה לדשבורד', `${APP_URL}/dashboard`)}
    <p style="font-size:13px;color:#888">ברוכים הבאים! לשאלות ניתן לפנות לצוות המערכת.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `✅ מוסדכם אושר — ברוכים הבאים למערכת גיוס חב"ד`,
    html: baseHtml('המוסד אושר', body),
  }).catch(e => console.error('[EMAIL] institution-approved:', e))
}

// ── Institution rejected ──────────────────────────────────────────────
export async function sendInstitutionRejectedEmail(opts: {
  institutionProfileId: string
  institutionName: string
}) {
  const email = await getEmailByProfileId(opts.institutionProfileId)
  if (!email) return

  const body = `
    <p>שלום,</p>
    <p>תודה על פנייתכם להצטרפות למערכת גיוס חב&quot;ד עבור <strong>${opts.institutionName}</strong>.</p>
    <p style="background:#fce4e4;border-right:4px solid #E53935;padding:12px 16px;border-radius:6px">
      לאחר בחינת הבקשה, לצערנו לא ניתן לאשר את הצטרפות המוסד בשלב זה.
    </p>
    <p>לפרטים נוספים או לערעור, ניתן לפנות ישירות לצוות המערכת.</p>
    <p style="font-size:13px;color:#888">בברכה, צוות מערכת גיוס חב"ד</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `עדכון על בקשת ההצטרפות — ${opts.institutionName}`,
    html: baseHtml('עדכון על בקשת ההצטרפות', body),
  }).catch(e => console.error('[EMAIL] institution-rejected:', e))
}

// ── Welcome new candidate ─────────────────────────────────────────────
export async function sendCandidateWelcomeEmail(opts: {
  candidateProfileId: string
  candidateName: string
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#e8eaf6;border-right:4px solid #5B3AAB;padding:12px 16px;border-radius:6px">
      🎉 ברוכה הבאה למערכת גיוס חב&quot;ד! הפרופיל שלך נוצר בהצלחה.
    </p>
    <p>הצעדים הבאים:</p>
    <ul style="padding-right:20px;line-height:2">
      <li>השלימי את הפרופיל שלך (עיר, תחום, רמה אקדמית)</li>
      <li>העלי קורות חיים</li>
      <li>גלשי במשרות הפתוחות והגישי מועמדות</li>
    </ul>
    ${btn('לפרופיל שלי', `${APP_URL}/profile`)}
    <p style="font-size:13px;color:#888">מאחלות לך הצלחה רבה! 🌟</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `ברוכה הבאה למערכת גיוס חב"ד — ${opts.candidateName}`,
    html: baseHtml('ברוכה הבאה', body),
  }).catch(e => console.error('[EMAIL] candidate-welcome:', e))
}

// ── Survey invitation ─────────────────────────────────────────────────
export async function sendSurveyEmail(opts: {
  profileId: string
  recipientName: string
  surveyType: 'candidate_about_institution' | 'institution_about_candidate'
  otherPartyName: string
  token: string
}) {
  const email = await getEmailByProfileId(opts.profileId)
  if (!email) return

  const isCandidate = opts.surveyType === 'candidate_about_institution'
  const subject = isCandidate
    ? `📝 שאלון שביעות רצון — ${opts.otherPartyName}`
    : `📝 הערכת תפקוד — ${opts.otherPartyName}`
  const intro = isCandidate
    ? `תודה על עבודתך ב-<strong>${opts.otherPartyName}</strong>! נשמח לשמוע את חוות דעתך.`
    : `תודה על שיתוף הפעולה עם <strong>${opts.otherPartyName}</strong>. נשמח לקבל משוב.`

  const body = `
    <p>שלום <strong>${opts.recipientName}</strong>,</p>
    <p style="background:#e8eaf6;border-right:4px solid #5B3AAB;padding:12px 16px;border-radius:6px">
      📝 ${intro}
    </p>
    <p>השאלון קצר (2 דקות) ויעזור לנו לשפר את המערכת.</p>
    ${btn('למילוי השאלון', `${APP_URL}/survey?t=${opts.token}`)}
    <p style="font-size:13px;color:#888">השאלון אנונימי וניתן למלא אותו רק פעם אחת.</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject,
    html: baseHtml('שאלון שביעות רצון', body),
  }).catch(e => console.error('[EMAIL] survey:', e))
}

// ── Interview reminder (24h before) ──────────────────────────────────
export async function sendInterviewReminderEmail(opts: {
  candidateProfileId: string
  candidateName: string
  jobTitle: string
  institutionName: string
  scheduledAt: string
  location?: string | null
}) {
  const email = await getEmailByProfileId(opts.candidateProfileId)
  if (!email) return

  const dt = new Date(opts.scheduledAt).toLocaleString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const body = `
    <p>שלום <strong>${opts.candidateName}</strong>,</p>
    <p style="background:#fff8e1;border-right:4px solid #F9A825;padding:12px 16px;border-radius:6px">
      ⏰ <strong>תזכורת:</strong> הראיון שלך נמחר <strong>מחר</strong>!
    </p>
    <table style="border-collapse:collapse;margin:16px 0;width:100%">
      <tr><td style="padding:8px 12px;background:#f5f5f5;border-radius:6px 0 0 6px;font-weight:600;width:100px">מוסד</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.institutionName}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">משרה</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.jobTitle}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">מועד</td>
          <td style="padding:8px 12px;background:#fafafa">${dt}</td></tr>
      ${opts.location ? `<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">מיקום</td>
          <td style="padding:8px 12px;background:#fafafa">${opts.location}</td></tr>` : ''}
    </table>
    ${btn('לדשבורד שלי', `${APP_URL}/dashboard`)}
    <p style="font-size:13px;color:#888">בהצלחה! 🌟</p>`

  await getResend()?.emails.send({
    from: FROM,
    to: email,
    subject: `⏰ תזכורת: ראיון מחר — ${opts.institutionName}`,
    html: baseHtml('תזכורת לראיון', body),
  }).catch(e => console.error('[EMAIL] reminder:', e))
}
