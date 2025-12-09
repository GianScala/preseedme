import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Smart Subject & Preheader
    const subject = `Welcome to the future of fundraising, ${username} 🚀`;
    const preheader = "You're in. Start connecting with investors and founders today.";

    const { data, error } = await resend.emails.send({
      from: 'PreseedMe Team <team@preseedme.com>',
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              /* The "Interactive Glow" simulation using CSS Gradients. */
              .glow-background {
                background-color: #050505;
                background-image: radial-gradient(circle at 50% 0%, rgba(33, 221, 192, 0.15) 0%, rgba(30, 27, 75, 0.3) 40%, #050505 80%);
                background-repeat: no-repeat;
                background-size: 100% 1000px;
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
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #000000; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                    
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                         <h1 style="margin: 0; font-size: 26px; letter-spacing: -0.5px; font-weight: 700;">
                          <span style="color: #ffffff;">Preseed</span><span style="color: #21DDC0;">Me</span>
                        </h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding: 10px 40px 40px;">
                        
                        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #ffffff; text-align: center;">
                          You're ready to launch.
                        </h2>
                        
                        <p style="margin: 0 0 30px; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
                          Welcome to the launchpad, <strong style="color: #ffffff;">${username}</strong>. You've joined a community of bootstrapped founders and forward-thinking investors.
                        </p>

                        <p style="margin: 0 0 20px; color: #a1a1aa; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                          Your Next Steps:
                        </p>

                        <table width="100%" cellpadding="0" cellspacing="0">
                          
                          <tr>
                            <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 10px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #21DDC0; font-weight: 600; font-size: 15px;">✨ Create Your First Pitch</p>
                                    <p style="margin: 6px 0 0; color: #71717a; font-size: 14px; line-height: 1.4;">
                                      Share your startup idea or MVP with potential investors.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          
                          <tr><td height="12"></td></tr>

                          <tr>
                            <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 10px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #21DDC0; font-weight: 600; font-size: 15px;">🔍 Explore Projects</p>
                                    <p style="margin: 6px 0 0; color: #71717a; font-size: 14px; line-height: 1.4;">
                                      Discover innovative startups and verify market trends.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr><td height="12"></td></tr>

                          <tr>
                            <td style="padding: 20px; background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 10px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #21DDC0; font-weight: 600; font-size: 15px;">💬 Start Connecting</p>
                                    <p style="margin: 6px 0 0; color: #71717a; font-size: 14px; line-height: 1.4;">
                                      Direct message founders and investors to build your network.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                        </table>

                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 35px;">
                          <tr>
                            <td align="center">
                              <a href="https://preseedme.com/ideas" style="display: inline-block; padding: 16px 40px; background-color: #21DDC0; color: #000000; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 50px; box-shadow: 0 4px 15px rgba(33, 221, 192, 0.2); transition: all 0.2s ease;">
                                Start Now →
                              </a>
                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>
                    
                  </table>
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 30px;">
                    <tr>
                      <td align="center">
                        <p style="margin: 0 0 10px; color: #52525b; font-size: 12px;">
                          Contact us at: <a href="mailto:team@preseedme.com" style="color: #52525b; text-decoration: underline;">team@preseedme.com</a>
                        </p>
                        <p style="margin: 0; color: #52525b; font-size: 12px;">
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