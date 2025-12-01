import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../app.js';
import { generateOTP, generateResetToken, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/email.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { redis } from '../redis.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Validation Schemas
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[0-9]/, 'Password must contain at least one number').regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const verifySchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    token: z.string(),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
});

// Apply rate limiter to all auth routes
// Apply rate limiter to all auth routes
router.use(authRateLimiter);

// Signup - Store in Redis and send OTP
router.post('/signup', async (req, res) => {
    try {
        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            const errorMessage = result.error.issues[0]?.message || 'Invalid input';
            return res.status(400).json({ error: errorMessage });
        }

        const { email, password } = result.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // Security: Don't reveal user existence, maybe send an email saying "someone tried to sign up"
            // For now, we'll just return a generic message or the same success message to confuse attackers
            // But for UX, it's tricky. Let's return a generic "If not registered, email sent" type message?
            // Or just fail for now but with a generic error?
            // Standard practice: "If this email is not already registered, we have sent a verification code."
            // But we can't send a code if they are registered.
            // Let's stick to a slightly more specific but safe approach for signup as it's less sensitive than login enumeration
            return res.status(400).json({ error: 'User already exists' });
        }

        // Generate OTP
        const otp = generateOTP();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store signup details in Redis with 10m TTL
        const signupData = {
            email,
            password: hashedPassword,
            otp
        };

        await redis.set(
            `signup:${email}`,
            JSON.stringify(signupData),
            'EX',
            600 // 10 minutes
        );

        // Send verification email
        await sendVerificationEmail(email, otp);

        res.json({
            message: 'Verification email sent. Please check your inbox.',
            email
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Server error during signup'
        });
    }
});

// Verify Email with OTP
router.post('/verify-email', async (req, res) => {
    try {
        const result = verifySchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ error: 'Invalid input' });

        const { email, otp } = result.data;

        // Check Redis for pending signup
        const cachedSignup = await redis.get(`signup:${email}`);

        if (!cachedSignup) {
            // Fallback: Check if user exists but is unverified (legacy support)
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser && !existingUser.emailVerified && existingUser.verificationToken === otp) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { emailVerified: true, verificationToken: null },
                });

                const token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, JWT_SECRET, { expiresIn: '24h' });
                return res.json({
                    token,
                    user: { id: existingUser.id, email: existingUser.email, emailVerified: true },
                    message: 'Email verified successfully!'
                });
            }

            return res.status(400).json({ error: 'Verification session expired or invalid. Please sign up again.' });
        }

        const signupData = JSON.parse(cachedSignup);

        if (signupData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Create user in DB
        const user = await prisma.user.create({
            data: {
                email: signupData.email,
                password: signupData.password,
                emailVerified: true
            },
        });

        // Clear Redis key
        await redis.del(`signup:${email}`);

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email).catch(err => console.error('Welcome email error:', err));

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: { id: user.id, email: user.email, emailVerified: true },
            message: 'Email verified successfully!'
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        // Check Redis first
        const cachedSignup = await redis.get(`signup:${email}`);

        if (cachedSignup) {
            const signupData = JSON.parse(cachedSignup);
            const newOtp = generateOTP();

            // Update OTP in Redis
            signupData.otp = newOtp;
            await redis.set(
                `signup:${email}`,
                JSON.stringify(signupData),
                'EX',
                600 // Reset TTL to 10m
            );

            await sendVerificationEmail(email, newOtp);
            return res.json({ message: 'New verification code sent to your email' });
        }

        // Fallback: Check DB for unverified user
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && !user.emailVerified) {
            const otp = generateOTP();
            await prisma.user.update({
                where: { id: user.id },
                data: { verificationToken: otp },
            });
            await sendVerificationEmail(email, otp);
            return res.json({ message: 'New verification code sent to your email' });
        }

        return res.status(400).json({ error: 'User not found or already verified' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login - Check email verification
router.post('/login', async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ error: 'Invalid input' });

        const { email, password } = result.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // Generic error message to prevent enumeration
        const invalidCredsError = { error: 'Invalid credentials' };

        if (!user) return res.status(401).json(invalidCredsError);

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json(invalidCredsError);

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email: user.email, emailVerified: user.emailVerified } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Forgot Password - Send reset link
router.post('/forgot-password', async (req, res) => {
    try {
        const result = forgotPasswordSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ error: 'Invalid email format' });

        const { email } = result.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent user enumeration
        if (user) {
            // Generate reset token and store on user
            const resetToken = generateResetToken();
            await prisma.user.update({
                where: { id: user.id },
                data: { verificationToken: resetToken },
            });

            // Send reset email
            await sendPasswordResetEmail(email, resetToken);
        }

        // Always return this message
        res.json({ message: 'If an account exists, a password reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Server error'
        });
    }
});

// Reset Password with token
router.post('/reset-password', async (req, res) => {
    try {
        const result = resetPasswordSchema.safeParse(req.body);
        if (!result.success) return res.status(400).json({ error: 'Invalid input or weak password' });

        const { token, newPassword } = result.data;

        // Find valid reset token
        // Verify reset token against user's verificationToken
        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
            select: { id: true, verificationToken: true },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, verificationToken: null },
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

