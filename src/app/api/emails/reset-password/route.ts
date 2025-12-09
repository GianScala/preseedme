// src/app/api/emails/reset-password/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const db = getFirebaseDb();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ success: true });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await setDoc(doc(db, 'passwordResets', userId), {
      token: resetToken,
      email,
      userId,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}&uid=${userId}`;
    const preheader = "Use this link to reset your password. It expires in 1 hour.";

    console.log('📧 Sending password reset email to:', email);

    const { data, error } = await resend.emails.send({
      from: 'PreseedMe Security <noreply@preseedme.com>',
      to: email,
      subject: 'Reset your password 🔑',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              /* Simulating your React "InteractiveBackground" using CSS gradients 
                 Because emails cannot run JavaScript/Canvas.
              */
              .glow-background {
                background-color: #050505;
                /* This radial gradient mimics your "Indigo" and "Teal" blobs mixed together */
                background-image: radial-gradient(circle at 50% 0%, rgba(33, 221, 192, 0.15) 0%, rgba(30, 27, 75, 0.3) 40%, #050505 80%);
                background-repeat: no-repeat;
                background-size: 100% 1000px; /* Limits glow to top area */
              }
            </style>
          </head>
          
          <body class="glow-background" style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #ffffff;">
            
            <div style="display: none; max-height: 0px; overflow: hidden;">
              ${preheader}
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: transparent;">
              <tr>
                <td align="center" style="padding: 60px 20px;">
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #000000; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                    
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 26px; letter-spacing: -0.5px; font-weight: 700;">
                          <span style="color: #ffffff;">Preseed</span><span style="color: #21DDC0;">Me</span>
                        </h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 10px 40px 40px; text-align: center;">
                        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">
                          Reset your password
                        </h2>
                        
                        <p style="margin: 0 0 32px; color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                          Hey <strong style="color: #ffffff;">${userData.username || 'there'}</strong>, we received a request to change your password.
                        </p>

                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${resetLink}" style="display: inline-block; padding: 16px 36px; background-color: #21DDC0; color: #000000; text-decoration: none; font-weight: 700; font-size: 15px; border-radius: 8px; transition: all 0.2s ease;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>

                        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1f1f1f;">
                          <p style="margin: 0 0 12px; color: #71717a; font-size: 13px;">
                            Or paste this link in your browser:
                          </p>
                          
                          <div style="background-color: #0a0a0a; padding: 12px; border-radius: 6px; border: 1px solid #1f1f1f;">
                            <p style="margin: 0; color: #21DDC0; font-size: 11px; word-break: break-all; font-family: 'SFMono-Regular', Consolas, monospace; line-height: 1.5;">
                              ${resetLink}
                            </p>
                          </div>
                        </div>

                        <p style="margin: 24px 0 0; color: #52525b; font-size: 12px;">
                          This link will expire in 60 minutes.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin-top: 30px;">
                    <tr>
                      <td align="center">
                        <p style="margin: 0; color: #52525b; font-size: 12px;">
                          © ${new Date().getFullYear()} PreseedMe Inc.
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
      console.error('❌ Failed to send reset email:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.log('✅ Reset email sent!', data);
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('❌ Server error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}