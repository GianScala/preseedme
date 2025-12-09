// src/app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    console.log('🚀 Attempting to send test email to:', to);

    const { data, error } = await resend.emails.send({
      from: 'team@preseedme.com', // Replace with YOUR domain
      to: to,
      subject: '✅ Test Email from PreseedMe',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #21DDC0;">🎉 Success!</h1>
          <p>Your Resend email integration is working perfectly!</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 14px;">
            This is a test email from PreseedMe. You can now use this for:
          </p>
          <ul style="color: #666;">
            <li>Welcome emails when users sign up</li>
            <li>Notifications</li>
            <li>Password resets</li>
            <li>And more!</li>
          </ul>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ Email sent successfully!', data);
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('❌ Server Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}