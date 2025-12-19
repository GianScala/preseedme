import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);

// Brand color
const BRAND_COLOR = '#21DDC0';

export async function POST(request: Request) {
  try {
    const { 
      recipientId, 
      senderName, 
      commentText, 
      ideaId,
      ideaTitle,
      notificationType,
      parentCommentId
    } = await request.json();

    if (!recipientId || !commentText || !ideaId || !notificationType) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const admin = getFirebaseAdmin(); 
    const adminDb = admin.firestore();

    const userDoc = await adminDb.collection('users').doc(recipientId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const email = userDoc.data()?.email;
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Debounce
    const debounceKey =
      notificationType === 'reply'
        ? `comment_${parentCommentId}`
        : `idea_${ideaId}`;

    const notifRef = adminDb.collection('notification_debounce').doc(debounceKey);
    const notifSnap = await notifRef.get();

    let shouldSendEmail = true;

    if (notifSnap.exists) {
      const data = notifSnap.data();
      if (data?.lastNotificationSentTo?.[recipientId]) {
        const lastSent = data.lastNotificationSentTo[recipientId].toDate();
        const minutes = (Date.now() - lastSent.getTime()) / 1000 / 60;
        if (minutes < 15) shouldSendEmail = false;
      }
    }

    if (!shouldSendEmail) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const ideaLink = `${process.env.NEXT_PUBLIC_APP_URL}/ideas/${ideaId}`;

    let subject = '';
    let preheader = '';
    let html = '';

    if (notificationType === 'new_comment') {
      subject = `💬 ${senderName} commented on your startup`;
      preheader = `New activity on "${ideaTitle}".`;

      html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">

<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:60px 20px;">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">

<tr>
<td style="padding:40px;text-align:center;">
<h1 style="margin:0;font-size:26px;font-weight:700;">
<span style="color:#111827;">Preseed</span><span style="color:${BRAND_COLOR};">Me</span>
</h1>
</td>
</tr>

<tr>
<td style="padding:0 40px 40px;text-align:center;">
<h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">
New Comment on your published project
</h2>

<p style="margin:0 0 30px;color:#6b7280;font-size:16px;">
<strong style="color:#111827;">${senderName}</strong> added a comment.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid ${BRAND_COLOR};border-radius:10px;text-align:left;">
<p style="margin:0 0 10px;color:${BRAND_COLOR};font-size:13px;font-weight:600;">
${ideaTitle}
</p>
<p style="margin:0;font-size:15px;line-height:1.6;">
"${commentText}"
</p>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
<tr>
<td align="center">
<a href="${ideaLink}" style="display:inline-block;padding:16px 40px;background:${BRAND_COLOR};color:#000000;text-decoration:none;font-weight:700;border-radius:999px;">
View Comment & Reply →
</a>
</td>
</tr>
</table>

</td>
</tr>
</table>

<p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
© ${new Date().getFullYear()} PreseedMe Inc.
</p>

</td>
</tr>
</table>

</body>
</html>`;
    } else {
      subject = `💬 ${senderName} replied to your comment`;
      preheader = `${senderName} replied on "${ideaTitle}".`;

      html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">

<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:60px 20px;">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">

<tr>
<td style="padding:40px;text-align:center;">
<h1 style="margin:0;font-size:26px;font-weight:700;">
<span style="color:#111827;">Preseed</span><span style="color:${BRAND_COLOR};">Me</span>
</h1>
</td>
</tr>

<tr>
<td style="padding:0 40px 40px;text-align:center;">
<h2 style="margin:0 0 16px;font-size:20px;font-weight:600;">
New Reply
</h2>

<p style="margin:0 0 30px;color:#6b7280;font-size:16px;">
<strong style="color:#111827;">${senderName}</strong> replied to your comment
</p>

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid ${BRAND_COLOR};border-radius:10px;text-align:left;">
<p style="margin:0 0 10px;color:${BRAND_COLOR};font-size:13px;font-weight:600;">
${ideaTitle}
</p>
<p style="margin:0;font-size:15px;line-height:1.6;">
"${commentText}"
</p>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
<tr>
<td align="center">
<a href="${ideaLink}" style="display:inline-block;padding:16px 40px;background:${BRAND_COLOR};color:#000000;text-decoration:none;font-weight:700;border-radius:999px;">
View Reply →
</a>
</td>
</tr>
</table>

</td>
</tr>
</table>

<p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
© ${new Date().getFullYear()} PreseedMe Inc.
</p>

</td>
</tr>
</table>

</body>
</html>`;
    }

    await resend.emails.send({
      from: 'PreseedMe Team <team@preseedme.com>',
      to: email,
      subject,
      html
    });

    await notifRef.set(
      {
        lastNotificationSentTo: {
          [recipientId]: FieldValue.serverTimestamp()
        },
        ideaId,
        notificationType,
        lastSender: senderName
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
