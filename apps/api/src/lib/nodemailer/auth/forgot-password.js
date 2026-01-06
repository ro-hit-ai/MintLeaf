const nodeMailer = require("nodemailer");
const mongoose = require("../../../db"); // use your db.js connection
const { createTransportProvider } = require("../../transport");

// Define an EmailConfig schema if you don’t already have one
const emailConfigSchema = new mongoose.Schema({
  reply: { type: String, required: true },
  host: String,
  port: Number,
  secure: Boolean,
  user: String,
  pass: String,
});

// Reuse model or create if not defined
const EmailConfig =
  mongoose.models.EmailConfig || mongoose.model("EmailConfig", emailConfigSchema);

async function forgotPassword(emailAddress, code, link, token) {
  try {
    // Fetch email config from Mongo
    const emailConfig = await EmailConfig.findOne();
    if (!emailConfig) {
      console.log("❌ No email configuration found in DB");
      return;
    }

    const resetLink = `${link}/auth/reset-password?token=${token}`;
    const transport = await createTransportProvider();

    console.log("📨 Sending email to:", emailAddress);

    let info = await transport.sendMail({
      from: emailConfig.reply, // from DB
      to: emailAddress, // user email
      subject: "Password Reset Request",
      text: `Password Reset Code: ${code}, follow this link to reset your password: ${resetLink}`,
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  </head>
  <body style="background-color:#ffffff;margin:0 auto;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif">
    <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto">
      <tr>
        <td>
          <h1 style="color:#1d1c1d;font-size:16px;font-weight:700;margin:10px 0;padding:0;line-height:42px">Password Reset</h1>
          <p>Password code: ${code}</p>
          <a href="${resetLink}">Reset Here</a>
          <p style="font-size:14px;margin:16px 0;color:#000">Kind regards,</p>
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tbody>
              <tr>
                <td>
                  <a target="_blank" style="color:#b7b7b7;text-decoration:underline" href="https://slackhq.com">Our blog</a> | 
                  <a target="_blank" style="color:#b7b7b7;text-decoration:underline" href="https://slack.com/legal">Documentation</a> | 
                  <a target="_blank" style="color:#b7b7b7;text-decoration:underline" href="https://slack.com/help">Discord</a>
                  <p style="font-size:12px;line-height:15px;margin:16px 0;color:#b7b7b7;text-align:left">
                    This was an automated message sent by peppermint.sh -> An open source helpdesk solution
                  </p>
                  <p style="font-size:12px;line-height:15px;margin:16px 0;color:#b7b7b7;text-align:left;margin-bottom:50px">
                    ©2022 Peppermint Ticket Management, a Peppermint Labs product.<br/>All rights reserved.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    });

    console.log("✅ Message sent:", info.messageId);
  } catch (error) {
    console.log("❌ Error sending forgot password email:", error);
  }
}

module.exports = { forgotPassword };
