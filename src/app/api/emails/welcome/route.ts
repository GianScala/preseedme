import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_COLOR = '#21DDC0';

export async function POST(request: Request) {
  try {
    const { email, username } = await request.json();

    if (!email || !username) {
      return NextResponse.json(
        { success: false, error: 'Email and username required' },
        { status: 400 }
      );
    }

    console.log('📧 Sending welcome email to:', email);

    const subject = `Welcome to the future of fundraising, ${username} 🚀`;
    const preheader = "You're in. Start connecting with investors and founders today.";

    const { data, error } = await resend.emails.send({
      from: 'PreseedMe Team <team@preseedme.com>',
      to: email,
      subject,
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Welcome to PreseedMe</title>
  </head>

  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${preheader}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f9fafb;">
      <tr>
        <td align="center" style="padding:60px 20px;">

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
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
              <td style="padding:10px 40px 40px;">
                <h2 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#111827;text-align:center;">
                  You're ready to launch.
                </h2>

                <p style="margin:0 0 24px;color:#6b7280;font-size:16px;line-height:1.6;text-align:center;">
                  Welcome to the launchpad, <strong style="color:#111827;">${username}</strong>.
                  You've joined a community of bootstrapped founders and forward-thinking investors.
                </p>

                <p style="margin:0 0 14px;color:#6b7280;font-size:13px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">
                  Your next steps
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding:18px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                      <p style="margin:0;color:${BRAND_COLOR};font-weight:800;font-size:15px;">✨ Create Your First Pitch</p>
                      <p style="margin:6px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                        Share your startup idea or MVP with potential investors.
                      </p>
                    </td>
                  </tr>

                  <tr><td height="12"></td></tr>

                  <tr>
                    <td style="padding:18px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                      <p style="margin:0;color:${BRAND_COLOR};font-weight:800;font-size:15px;">🔍 Explore Projects</p>
                      <p style="margin:6px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                        Discover innovative startups and verify market trends.
                      </p>
                    </td>
                  </tr>

                  <tr><td height="12"></td></tr>

                  <tr>
                    <td style="padding:18px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                      <p style="margin:0;color:${BRAND_COLOR};font-weight:800;font-size:15px;">💬 Start Connecting</p>
                      <p style="margin:6px 0 0;color:#6b7280;font-size:14px;line-height:1.5;">
                        Direct message founders and investors to build your network.
                      </p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px;">
                  <tr>
                    <td align="center">
                      <a href="https://preseedme.com/ideas"
                         style="display:inline-block;padding:14px 34px;background-color:${BRAND_COLOR};color:#000000;text-decoration:none;font-weight:900;font-size:16px;border-radius:999px;">
                        Start Now →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-top:18px;">
            <tr>
              <td align="center" style="padding:0 10px;">
                <p style="margin:0 0 10px;color:#9ca3af;font-size:12px;">
                  Contact us at:
                  <a href="mailto:team@preseedme.com" style="color:#6b7280;text-decoration:underline;">team@preseedme.com</a>
                </p>
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  © ${new Date().getFullYear()} PreseedMe Inc. San Francisco, CA.
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
      console.error('❌ Failed to send welcome email:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.log('✅ Welcome email sent!', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ Server error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
