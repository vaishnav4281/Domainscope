import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config';

interface OTPVerificationModalProps {
    open: boolean;
    onClose: () => void;
    email: string;
    onVerified: (token: string) => void;
}

export default function OTPVerificationModal({ open, onClose, email, onVerified }: OTPVerificationModalProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Cooldown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-focus first input when modal opens
    useEffect(() => {
        if (open && inputRefs.current[0]) {
            inputRefs.current[0]?.focus();
        }
    }, [open]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.slice(0, 6).split('');
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = char;
                }
            });
            setOtp(newOtp);

            // Focus last filled input
            const lastIndex = Math.min(index + pastedData.length, 5);
            inputRefs.current[lastIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        setIsVerifying(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            toast.success('Email verified successfully! 🎉');
            onVerified(data.token);
        } catch (error: any) {
            toast.error(error.message || 'Invalid or expired code');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to resend code');
            }

            toast.success('New verification code sent!');
            setResendCooldown(60); // 60 second cooldown
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-red-600 to-blue-600 rounded-full w-fit">
                        <Mail className="h-6 w-6 text-white" />
                    </div>
                    <DialogTitle className="text-center text-2xl">Verify Your Email</DialogTitle>
                    <DialogDescription className="text-center">
                        We've sent a 6-digit code to<br />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{email}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                            <Input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-blue-500"
                                disabled={isVerifying}
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        disabled={isVerifying || otp.join('').length !== 6}
                        className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify Email'
                        )}
                    </Button>

                    {/* Resend Code */}
                    <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Didn't receive the code?
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={isResending || resendCooldown > 0}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Resend in ${resendCooldown}s`
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Resend Code
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Expiry Notice */}
                    <p className="text-xs text-center text-slate-500">
                        ⏱️ Code expires in 10 minutes
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
