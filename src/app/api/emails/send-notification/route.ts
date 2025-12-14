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
    
    // 1. ROBUST DEBOUNCE LOGIC (15 Mins)
    const convRef = adminDb.collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();
    
    let shouldSendEmail = true;
    let debugReason = "First message or no history";

    if (convSnap.exists) {
      const convData = convSnap.data();
      
      if (convData?.lastNotificationSentTo && convData.lastNotificationSentTo[recipientId]) {
        const lastSent = convData.lastNotificationSentTo[recipientId].toDate();
        const timeDiff = (Date.now() - lastSent.getTime()) / 1000 / 60; // in minutes
        
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
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const email = userData?.email;

    if (!email) {
      return NextResponse.json({ success: false, error: 'User has no email' }, { status: 400 });
    }

    // 3. Send Email
    console.log(`[NOTIFY-SEND] Sending email to ${email} (${debugReason})`);

    const conversationLink = `${process.env.NEXT_PUBLIC_APP_URL}/chat/${conversationId}`;
    
    await resend.emails.send({
      from: 'Preseedme <noreply@preseedme.com>',
      to: email,
      subject: `New message from ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin: 0; padding: 0; font-family: sans-serif; color: #ffffff; background-color: #050505;">
            <div style="padding: 40px; text-align: center;">
                <h1 style="color: #fff;">Preseed<span style="color: #21DDC0;">Me</span></h1>
                <p style="color: #aaa;"><strong>${senderName}</strong> sent you a message:</p>
                <div style="background: #111; padding: 20px; border-left: 3px solid #21DDC0; text-align: left; margin: 20px auto; max-width: 500px; color: #eee;">
                    "${messageText}"
                </div>
                <a href="${conversationLink}" style="display: inline-block; padding: 12px 24px; background-color: #21DDC0; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply Now</a>
            </div>
          </body>
        </html>
      `,
    });

    // 4. Update the "Last Sent" map
    await convRef.set({
      lastNotificationSentTo: {
        [recipientId]: FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Notification API Failed:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}