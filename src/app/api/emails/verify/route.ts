import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_COLOR = '#21DDC0';

export async function POST(request: Request) {
  try {
    const { email, username, userId } = await request.json();

    if (!email || !username || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Secure Token Generation
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Firestore Logic
    const db = getFirebaseDb();
    await setDoc(doc(db, 'emailVerifications', userId), {
      token: verificationToken,
      email,
      userId,
      expiresAt,
      verified: false,
      createdAt: new Date(),
    });

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}&uid=${userId}`;

    console.log('📧 Sending verification email to:', email);

    const preheader =
      'Please verify your email address to secure your PreseedMe account.';

    const { data, error } = await resend.emails.send({
      from: 'PreseedMe Security <noreply@preseedme.com>',
      to: email,
      subject: 'Verify your identity 🔐',
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Verify your email</title>
  </head>

  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preheader}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f9fafb;">
      <tr>
        <td align="center" style="padding:60px 20px;">

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:500px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:40px 40px 20px;text-align:center;">
                <h1 style="margin:0;font-size:26px;letter-spacing:-0.5px;font-weight:700;line-height:1.2;">
                  <span style="color:#111827;">Preseed</span><span style="color:${BRAND_COLOR};">Me</span>
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:10px 40px 40px;text-align:center;">
                <h2 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#111827;">
                  Verify your email address
                </h2>

                <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                  Hey <strong style="color:#111827;">${username}</strong>, thanks for joining! Please click the button below to verify your account and start connecting.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center">
                      <a href="${verificationLink}"
                         style="display:inline-block;padding:14px 28px;background-color:${BRAND_COLOR};color:#000000;text-decoration:none;font-weight:800;font-size:15px;border-radius:12px;">
                        Verify My Account
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:34px;padding-top:18px;border-top:1px solid #e5e7eb;text-align:left;">
                  <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">
                    Or paste this link in your browser:
                  </p>

                  <div style="background-color:#f9fafb;padding:12px;border-radius:10px;border:1px solid #e5e7eb;">
                    <p style="margin:0;color:${BRAND_COLOR};font-size:11px;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;line-height:1.5;">
                      ${verificationLink}
                    </p>
                  </div>
                </div>

                <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">
                  This link expires in 24 hours.
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:500px;margin-top:18px;">
            <tr>
              <td align="center" style="padding:0 10px;">
                <p style="margin:0 0 10px;color:#9ca3af;font-size:12px;">
                  Contact us at:
                  <a href="mailto:team@preseedme.com" style="color:#6b7280;text-decoration:underline;">team@preseedme.com</a>
                </p>
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  © ${new Date().getFullYear()} PreseedMe Inc. Secure Login System.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    });

    if (error) {
      console.error('❌ Failed to send verification email:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ Verification email sent!', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Server error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
