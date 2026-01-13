"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { emailSignUpAndCreateProfile, getFirebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{ email: string; userId: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sendVerificationEmails = async (email: string, username: string, userId: string) => {
    console.log('📧 Attempting to send emails to:', email);
    console.log('User ID:', userId);
    console.log('Username:', username);
    
    try {
      // Send verification email
      console.log('Calling /api/emails/verify...');
      const verifyRes = await fetch('/api/emails/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, userId }),
      });

      const verifyData = await verifyRes.json();
      console.log('Verify API response:', verifyData);

      if (!verifyRes.ok) {
        console.error('❌ Verify email failed:', verifyData);
        throw new Error(verifyData.error || 'Failed to send verification email');
      }

      // Send welcome email
      console.log('Calling /api/emails/welcome...');
      const welcomeRes = await fetch('/api/emails/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });

      const welcomeData = await welcomeRes.json();
      console.log('Welcome API response:', welcomeData);

      if (!welcomeRes.ok) {
        console.warn('⚠️ Welcome email failed (non-critical):', welcomeData);
      }

      console.log('✅ Emails sent successfully!');
      return true;
    } catch (err) {
      console.error('❌ Email sending error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setInfo(null);

    if (!username.trim()) return setError("Please enter a username.");
    if (!email.trim()) return setError("Please enter your email.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");

    try {
      setSubmitting(true);
      console.log('🚀 Starting registration process...');

      // 1. Create user & profile
      console.log('Step 1: Creating Firebase user...');
      const cred = await emailSignUpAndCreateProfile(
        email.trim(),
        password,
        username.trim()
      );

      const userId = cred.user.uid;
      const createdEmail = cred.user.email ?? email.trim();
      console.log('✅ User created:', userId);

      // 2. Send verification emails
      console.log('Step 2: Sending verification emails...');
      try {
        await sendVerificationEmails(createdEmail, username.trim(), userId);
        console.log('✅ Account created and emails sent!');
      } catch (emailErr: any) {
        console.error('❌ Email sending failed:', emailErr);
        setError(`Account created but email failed: ${emailErr.message}. Use resend button below.`);
      }

      // 3. Sign them out (force verification)
      console.log('Step 3: Signing out user to force verification...');
      const auth = getFirebaseAuth();
      await signOut(auth);

      setInfo({ email: createdEmail, userId });
      setPassword("");
      console.log('✅ Registration complete!');

    } catch (err: any) {
      console.error('❌ Registration error:', err);
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError("That email is already in use. Try signing in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger one.");
      } else {
        setError(err?.message ?? "Failed to create account. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!info || resending) return;

    try {
      setResending(true);
      setError(null);
      console.log('🔄 Resending verification email...');

      await sendVerificationEmails(info.email, username.trim(), info.userId);
      
      alert('✅ Verification email resent! Check your inbox.');
    } catch (err: any) {
      console.error('❌ Resend failed:', err);
      setError(`Failed to resend: ${err.message}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className={[
        "flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center",
        "gap-12 lg:flex-row lg:items-center lg:gap-24",
        "py-10 sm:py-16",
        "transition-all duration-700 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      {/* Left side: Context / Value Prop */}
      <section className="w-full max-w-md space-y-6 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/5 px-3 py-1 text-[10px] sm:text-xs font-bold text-[var(--brand)] uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand)]"></span>
          </span>
          Start Building
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          Turn your idea <br />
          into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-light)] to-[var(--brand)]">funded reality.</span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-sm mx-auto lg:mx-0">
          Join thousands of solo founders and micro-investors building the future together.
        </p>

        <ul className="hidden sm:block space-y-3 pt-2">
          {[
            "Create your founder profile",
            "Post ideas and get feedback",
            "Secure your first $1K-$10K"
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-neutral-300 justify-center lg:justify-start">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Right side: Glass Form Card */}
      <section className="w-full max-w-sm sm:max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="mt-2 text-sm text-neutral-400">
              It takes less than a minute to get started.
            </p>
          </div>

          {/* Success State */}
          {info ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Check your email</h3>
                <p className="mt-2 text-sm text-emerald-200">
                  We sent a verification link to <br/> <span className="font-bold text-white">{info.email}</span>
                </p>
                <p className="mt-4 text-xs text-neutral-400">
                  Click the link in that email, then come back to sign in.
                </p>
              </div>

              {/* Resend Button */}
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? '📧 Resending...' : '↻ Resend Verification Email'}
              </button>

              <button
                onClick={() => router.push("/auth")}
                className="w-full rounded-lg bg-emerald-500/20 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Your name or alias"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="founder@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-all"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-[var(--brand)] py-3 text-sm font-bold text-black shadow-[0_0_20px_rgba(33,221,192,0.15)] hover:shadow-[0_0_25px_rgba(33,221,192,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {!info && (
            <p className="mt-6 text-center text-xs text-neutral-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="font-bold text-white hover:text-[var(--brand)] transition-colors underline underline-offset-4"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}