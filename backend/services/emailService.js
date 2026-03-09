import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_WAPt6yvF_CggJZBY1v3fLBsBHR9osLurM';
const resend = new Resend(resendApiKey);

export async function sendEmail(to, subject, htmlBody) {
    try {
        const data = await resend.emails.send({
            from: 'SkillVerse <onboarding@resend.dev>', // MUST be this exact string for Resend free tiers on unverified domains
            reply_to: 'ravenampere0123@gmail.com',
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
