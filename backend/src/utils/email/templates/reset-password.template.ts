export const resetPasswordEmailTemplate = (href: string) => {
  return `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <tr>
              <td style="padding: 40px; text-align: center;">
                <h2 style="color: #212121; margin-bottom: 10px;">Reset Your Password</h2>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  We received a request to reset your password. Click the button below to set a new one.
                  This link is valid for a limited time.
                </p>
                <a href="${href}" target="_blank"
                  style="display: inline-block; margin-top: 25px; padding: 12px 24px; font-size: 16px; color: #fff; background-color: #6D9886; text-decoration: none; border-radius: 5px;">
                  Reset Password
                </a>
                <p style="margin-top: 30px; font-size: 13px; color: #999;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #212121; padding: 20px; text-align: center;">
                <p style="color: #fff; font-size: 13px;">&copy; 2025 Elite Messenger. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
};
