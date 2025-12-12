import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import Footer from '@/components/Footer';

import SEO from '@/components/SEO';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsSubmitting(true);
        try {
            // Create a timeout promise (60s)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 60000)
            );

            const fetchPromise = fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
            const data = await res.json();

            if (res.ok) {
                setEmailSent(true);
                toast.success('Password reset link sent!');
            } else {
                toast.error(data.error || 'Failed to send reset link');
                // Do NOT set emailSent to true on error
            }
        } catch (error: any) {
            if (error.message === 'timeout') {
                toast.error('Request timeout. Server may be waking up, please try again.');
            } else {
                toast.error('Connection failed. Please try again.');
            }
            console.error('Forgot password error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col">
            <SEO
                title="Forgot Password"
                description="Reset your DomainScope password securely."
            />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0B0F19] dark:to-[#0f1419] p-4">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293720_1px,transparent_1px),linear-gradient(to_bottom,#1f293720_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-400/10 dark:bg-red-600/20 rounded-full blur-3xl" />
                </div>

                <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                    <CardHeader className="space-y-4 pb-6">
                        <div className="mx-auto p-3 bg-gradient-to-r from-red-600 to-blue-600 rounded-full w-fit">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-2 text-center">
                            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                                {emailSent ? 'Check Your Email' : 'Forgot Password?'}
                            </CardTitle>
                            <CardDescription className="text-base">
                                {emailSent
                                    ? "We've sent password reset instructions to your email address"
                                    : 'Enter your email and we\'ll send you a reset link'}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {!emailSent ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-12 border-2"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-semibold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                                Email sent successfully!
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                Check your inbox for password reset instructions. The link will expire in 1 hour.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                                    <p>Didn't receive the email?</p>
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setEmailSent(false);
                                            setEmail('');
                                        }}
                                        className="text-blue-600 hover:text-blue-700 p-0 h-auto font-semibold"
                                    >
                                        Try again
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Link to="/login">
                                <Button variant="ghost" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
}
