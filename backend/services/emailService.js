import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_3ukT4Pws_BmYcGQXMq5G7Y5sJ2NaxkbK5';
const resend = new Resend(resendApiKey);

export async function sendEmail(to, subject, htmlBody) {
    try {
        const data = await resend.emails.send({
            from: 'Skillverse <billing@atssfiber.ph>', // MUST be this exact string for Resend free tiers on unverified domains
            reply_to: 'billing@atssfiber.ph',
            to: [to],
            subject: subject,
            html: htmlBody
        });

        console.log(`Email sent successfully via Resend to ${to}`, data);
        return true;
    } catch (error) {
        console.error('Error sending email with Resend:', error);
        throw error;
    }
}
