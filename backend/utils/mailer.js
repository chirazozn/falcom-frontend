const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,   // your gmail or SMTP user
    pass: process.env.SMTP_PASS,   // app password (not your account password)
  },
});

const sendResetEmail = async (toEmail, userName, code) => {
  const mailOptions = {
    from: `"FALCOM Platform" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your FALCOM Password Reset Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f8fc; margin:0; padding:0; }
          .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff;
                     border-radius: 16px; overflow: hidden;
                     box-shadow: 0 4px 24px rgba(10,37,64,0.10); }
          .header { background: linear-gradient(135deg,#0a2540 0%,#1a5cad 100%);
                    padding: 36px 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 1.8rem; letter-spacing:0.1em; }
          .header p  { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size:0.9rem; }
          .body   { padding: 36px 40px; }
          .greeting { font-size: 1rem; color: #0a2540; margin-bottom: 16px; }
          .code-box { background: #eaf1f8; border-radius: 12px; padding: 24px;
                      text-align: center; margin: 24px 0; }
          .code     { font-size: 2.4rem; font-weight: 800; letter-spacing: 0.4em;
                      color: #1a5cad; }
          .note     { font-size: 0.82rem; color: #7a94b8; margin-top: 8px; }
          .footer   { background: #f5f8fc; padding: 20px 40px; text-align:center;
                      font-size: 0.78rem; color: #7a94b8; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>FALCOM</h1>
            <p>Project Management Platform</p>
          </div>
          <div class="body">
            <p class="greeting">Hello <strong>${userName}</strong>,</p>
            <p style="color:#3a5272;font-size:0.9rem;line-height:1.6;">
              We received a request to reset your FALCOM password.
              Use the code below to proceed. It is valid for <strong>15 minutes</strong>.
            </p>
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="note">This code expires in 15 minutes</div>
            </div>
            <p style="color:#7a94b8;font-size:0.82rem;line-height:1.6;">
              If you did not request a password reset, you can safely ignore this email.
              Your password will not be changed.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} FALCOM. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Reset email sent to ${toEmail} — MessageId: ${info.messageId}`);
  return info;
};

module.exports = { sendResetEmail };