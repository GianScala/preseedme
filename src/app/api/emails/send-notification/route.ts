import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { recipientId, senderName, messageText, conversationId } = await request.json();

    if (!recipientId || !messageText || !conversationId) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const admin = getFirebaseAdmin(); 
    const adminDb = admin.firestore();
    
    // 1. ROBUST DEBOUNCE LOGIC
    const convRef = adminDb.collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();
    
    // Default to TRUE (Send email) if we can't find data
    let shouldSendEmail = true;
    let debugReason = "First message or no history";

    if (convSnap.exists) {
      const convData = convSnap.data();
      
      // Check if we have sent a notification to THIS specific user recently
      if (convData?.lastNotificationSentTo && convData.lastNotificationSentTo[recipientId]) {
        const lastSent = convData.lastNotificationSentTo[recipientId].toDate();
        const timeDiff = (Date.now() - lastSent.getTime()) / 1000 / 60; // in minutes
        
        // If sent less than 15 mins ago, SKIP
        if (timeDiff < 15) {
          shouldSendEmail = false;
          debugReason = `Debounced: Last sent ${Math.round(timeDiff)} mins ago`;
        } else {
          debugReason = `Time elapsed: ${Math.round(timeDiff)} mins > 15 mins`;
        }
      }
    }

    if (!shouldSendEmail) {
      console.log(`[NOTIFY-SKIP] ${debugReason}`);
      return NextResponse.json({ success: true, skipped: true, reason: debugReason });
    }

    // 2. Get Recipient Email
    const userDoc = await adminDb.collection('users').doc(recipientId).get();
    
    if (!userDoc.exists) {
      console.error(`[NOTIFY-ERROR] User ${recipientId} not found`);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const email = userData?.email;

    if (!email) {
      console.error(`[NOTIFY-ERROR] User ${recipientId} has no email`);
      return NextResponse.json({ success: false, error: 'User has no email' }, { status: 400 });
    }

    // 3. Send Email
    console.log(`[NOTIFY-SEND] Sending email to ${email} (${debugReason})`);

    const conversationLink = `${process.env.NEXT_PUBLIC_APP_URL}/chat/${conversationId}`;
    
    const { data, error } = await resend.emails.send({
      from: 'PreseedMe Notifications <noreply@preseedme.com>',
      to: email,
      subject: `New message from ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <style>
              .glow-background {
                background-color: #050505;
                background-image: radial-gradient(circle at 50% 0%, rgba(33, 221, 192, 0.15) 0%, rgba(30, 27, 75, 0.3) 40%, #050505 80%);
                background-repeat: no-repeat;
                background-size: 100% 1000px;
              }
            </style>
          </head>
          <body class="glow-background" style="margin: 0; padding: 0; font-family: sans-serif; color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding: 60px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #000000; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden;">
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                         <h1 style="margin: 0; font-size: 26px; font-weight: 700;">
                          <span style="color: #ffffff;">Preseed</span><span style="color: #21DDC0;">Me</span>
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 40px 40px; text-align: center;">
                        <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 15px;">
                          <strong>${senderName}</strong> sent you a message:
                        </p>
                        
                        <div style="background-color: #111; padding: 20px; border-left: 3px solid #21DDC0; border-radius: 4px; text-align: left; margin-bottom: 30px;">
                          <p style="margin: 0; color: #e4e4e7; font-style: italic;">"${messageText}"</p>
                        </div>

                        <a href="${conversationLink}" style="display: inline-block; padding: 14px 32px; background-color: #21DDC0; color: #000000; text-decoration: none; font-weight: 700; border-radius: 8px;">
                          Reply Now
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin-top: 20px; color: #52525b; font-size: 12px;">© ${new Date().getFullYear()} PreseedMe Inc.</p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[NOTIFY-ERROR] Resend failed:", error);
      throw error;
    }

    // 4. Update the "Last Sent" map just for this user
    // This starts the 15-minute timer for the NEXT message
    await convRef.set({
      lastNotificationSentTo: {
        [recipientId]: FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('🔥 Notification API Failed:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}