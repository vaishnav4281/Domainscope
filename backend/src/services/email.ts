import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize SMTP Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 30000, // 30 seconds (instead of default 2 minutes)
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 30000,     // 30 seconds
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.SMTP_USER || 'noreply@domainscope.kerala.gov.in';

// Generate 6-digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure reset token
export function generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Send signup verification email with OTP
export async function sendVerificationEmail(email: string, otp: string) {
    try {
        console.log('📧 Sending verification email to:', email, 'OTP:', otp);

        // Mock email sending if SMTP is not configured
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
            console.log('⚠️ SMTP not configured. Simulating email send...');
            return { messageId: 'mock-verification-id' };
        }

        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject: 'Verify your DomainScope account',
            html: getVerificationEmailHTML(otp),
        });

        console.log('✅ Verification email sent:', info.messageId);
        return info;
    } catch (error: any) {
        console.error('Email send error:', error);
        throw new Error(`SMTP Error: ${error.message || 'Failed to send verification email'}`);
    }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

    try {
        // Mock email sending if SMTP is not configured
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
            console.log('⚠️ SMTP not configured. Simulating email send...');
            console.log('🔑 Password Reset Link:', resetUrl);
            return { messageId: 'mock-reset-id' };
        }

        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject: 'Reset your DomainScope password',
            html: getPasswordResetEmailHTML(resetUrl),
        });

        console.log('✅ Password reset email sent:', info.messageId);
        return info;
    } catch (error: any) {
        console.error('Email send error:', error);
        throw new Error('Failed to send password reset email');
    }
}

// Send welcome email after verification
export async function sendWelcomeEmail(email: string) {
    try {
        // Mock email sending if SMTP is not configured
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.example.com') {
            console.log('⚠️ SMTP not configured. Simulating email send...');
            return { messageId: 'mock-welcome-id' };
        }

        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: email,
            subject: 'Welcome to DomainScope! 🎉',
            html: getWelcomeEmailHTML(),
        });

        console.log('✅ Welcome email sent:', info.messageId);
        return info;
    } catch (error: any) {
        console.error('Welcome email error:', error);
        // Don't throw - welcome email is not critical
        return null;
    }
}

// Email HTML Templates

function getVerificationEmailHTML(otp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; }
        .subtitle { color: #f1f5f9; font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .title { color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; }
        .text { color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
        .otp-container { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px solid #cbd5e1; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0; }
        .otp-code { font-size: 48px; font-weight: 700; letter-spacing: 12px; color: #1e293b; margin: 0; font-family: 'Courier New', monospace; }
        .otp-label { color: #64748b; font-size: 14px; margin-top: 12px; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .warning-text { color: #92400e; font-size: 14px; margin: 0; }
        .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #64748b; font-size: 12px; margin: 0; }
        .footer-link { color: #2563eb; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">🔍 DomainScope</h1>
            <p class="subtitle">Advanced Domain Intelligence Platform</p>
        </div>
        <div class="content">
            <h2 class="title">Verify Your Email Address</h2>
            <p class="text">Welcome to DomainScope! To complete your registration, please use the verification code below:</p>
            
            <div class="otp-container">
                <div class="otp-code">${otp}</div>
                <p class="otp-label">⏱️ Valid for 10 minutes</p>
            </div>
            
            <p class="text">Enter this code in the verification page to activate your account and start analyzing domains.</p>
            
            <div class="warning">
                <p class="warning-text">⚠️ If you didn't create a DomainScope account, you can safely ignore this email.</p>
            </div>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 DomainScope. All rights reserved.</p>
            <p class="footer-text">Need help? <a href="mailto:support@domainscope.com" class="footer-link">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
    `;
}

function getPasswordResetEmailHTML(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; }
        .content { padding: 40px 30px; }
        .title { color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; }
        .text { color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
        .button-container { text-align: center; margin: 32px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .button:hover { opacity: 0.9; }
        .info-box { background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px; }
        .info-text { color: #1e40af; font-size: 14px; margin: 0; }
        .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #64748b; font-size: 12px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">🔍 DomainScope</h1>
        </div>
        <div class="content">
            <h2 class="title">Reset Your Password</h2>
            <p class="text">We received a request to reset your DomainScope account password. Click the button below to create a new password:</p>
            
            <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="info-box">
                <p class="info-text">🔒 This link will expire in 1 hour for security reasons.</p>
            </div>
            
            <p class="text">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p class="text" style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 DomainScope. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}

function getWelcomeEmailHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to DomainScope</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; }
        .emoji { font-size: 48px; margin: 16px 0; }
        .content { padding: 40px 30px; }
        .title { color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; }
        .text { color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
        .feature { background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .feature-icon { font-size: 24px; margin-bottom: 8px; }
        .feature-title { color: #1e293b; font-weight: 600; font-size: 14px; margin: 0 0 4px 0; }
        .feature-desc { color: #64748b; font-size: 12px; margin: 0; }
        .button-container { text-align: center; margin: 32px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .button:hover { opacity: 0.9; }
        .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { color: #64748b; font-size: 12px; margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">🔍 DomainScope</h1>
        </div>
        <div class="content">
            <h2 class="title">Welcome to DomainScope!</h2>
            <p class="text">Your account is now verified and ready to use. Start analyzing domains with our powerful intelligence platform.</p>
            
            <div class="feature-grid">
                <div class="feature">
                    <div class="feature-icon">🔍</div>
                    <h3 class="feature-title">WHOIS Lookup</h3>
                    <p class="feature-desc">Domain registration details</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🛡️</div>
                    <h3 class="feature-title">VirusTotal</h3>
                    <p class="feature-desc">Security threat analysis</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🌐</div>
                    <h3 class="feature-title">IP Intelligence</h3>
                    <p class="feature-desc">IPQS & AbuseIPDB scoring</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <h3 class="feature-title">DNS Blacklist</h3>
                    <p class="feature-desc">Reputation monitoring</p>
                </div>
            </div>
            
            <p class="text">Ready to get started? Log in to your account and run your first scan!</p>

            <div class="button-container">
                <a href="${FRONTEND_URL}" class="button">Go to Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p class="footer-text">© 2025 DomainScope. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}
