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
    
    // 1. DEBOUNCE LOGIC (15 Minutes)
    const convRef = adminDb.collection('conversations').doc(conversationId);
    const convSnap = await convRef.get();
    let shouldSendEmail = true;
    let debugReason = "No history found";

    if (convSnap.exists) {
      const convData = convSnap.data();
      if (convData?.lastNotificationSentTo && convData.lastNotificationSentTo[recipientId]) {
        const lastSent = convData.lastNotificationSentTo[recipientId].toDate();
        const timeDiff = (Date.now() - lastSent.getTime()) / 1000 / 60; // Minutes
        
        if (timeDiff < 15) {
          shouldSendEmail = false;
          debugReason = `Debounced (Last sent ${Math.round(timeDiff)}m ago)`;
        }
      }
    }

    if (!shouldSendEmail) {
      console.log(`[API] Skipped: ${debugReason}`);
      return NextResponse.json({ success: true, skipped: true, reason: debugReason });
    }

    // 2. Get Recipient Email
    const userDoc = await adminDb.collection('users').doc(recipientId).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userData = userDoc.data();
    const email = userData?.email;

    if (!email) return NextResponse.json({ error: 'No email found' }, { status: 400 });

    // 3. Send Email
    console.log(`[API] Sending to ${email}...`);
    const conversationLink = `${process.env.NEXT_PUBLIC_APP_URL}/chat/${conversationId}`;
    
    await resend.emails.send({
      from: 'Preseedme <noreply@preseedme.com>',
      to: email,
      subject: `New message from ${senderName}`,
      html: `<p><strong>${senderName}</strong> sent a message: "${messageText}"</p><p><a href="${conversationLink}">Reply Now</a></p>`
    });

    // 4. Update Timestamp
    await convRef.set({
      lastNotificationSentTo: { [recipientId]: FieldValue.serverTimestamp() }
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}