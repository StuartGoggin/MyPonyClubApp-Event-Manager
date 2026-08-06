import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { UserService } from '@/lib/user-service';
import {
  createEventRequestVerification,
  normalizeEmail,
  verifyEventRequestToken,
} from '@/lib/event-request-verification';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getVerificationUrl = (request: NextRequest, token: string) => {
  const requestUrl = new URL(request.url);
  const isAllowedHost = requestUrl.hostname === 'localhost'
    || requestUrl.hostname === '127.0.0.1'
    || requestUrl.hostname === 'myponyclub.events'
    || requestUrl.hostname.endsWith('.myponyclub.events');
  const origin = isAllowedHost ? requestUrl.origin : 'https://myponyclub.events';

  return `${origin}/request-event?verification=${encodeURIComponent(token)}`;
};

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Email verification is not currently available.' },
        { status: 503 },
      );
    }

    const { userId, email } = await request.json();
    if (typeof userId !== 'string' || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'A member and email address are required.' }, { status: 400 });
    }

    const user = await UserService.getUserById(userId);
    const memberEmail = user?.email;
    const emailMatchesMember = user?.isActive
      && memberEmail
      && normalizeEmail(memberEmail) === normalizeEmail(email);

    // Return the same response for non-matches so the public form cannot be used to confirm member details.
    if (!emailMatchesMember || !user?.clubId || !memberEmail) {
      return NextResponse.json({
        success: true,
        message: 'If the email matches the selected active member, a verification link has been sent.',
      });
    }

    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Pony Club member';
    const verification = await createEventRequestVerification(user.id, user.clubId, displayName, memberEmail);

    if (verification.throttled) {
      return NextResponse.json({
        success: true,
        message: 'If the email matches the selected active member, a verification link has been sent.',
      });
    }

    const verificationUrl = getVerificationUrl(request, verification.token!);
    const safeDisplayName = escapeHtml(displayName);
    const result = await resend.emails.send({
      from: 'MyPonyClub Events <noreply@myponyclub.events>',
      to: [memberEmail],
      subject: 'Verify your email to reuse a previous event request',
      html: `<p>Hello ${safeDisplayName},</p><p>Use the link below to reuse a previous event as a template. It expires in 30 minutes.</p><p><a href="${verificationUrl}">Verify email and view previous events</a></p><p>If you did not request this, you can ignore this email.</p>`,
      text: `Hello ${displayName},\n\nVerify your email to reuse a previous event request. This link expires in 30 minutes:\n${verificationUrl}\n\nIf you did not request this, you can ignore this email.`,
    });

    if (result.error) {
      console.error('Event request verification email failed:', result.error);
      return NextResponse.json({ error: 'Unable to send the verification email. Please try again later.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: 'If the email matches the selected active member, a verification link has been sent.',
    });
  } catch (error) {
    console.error('Event request verification error:', error);
    return NextResponse.json({ error: 'Unable to start email verification.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Verification link is missing.' }, { status: 400 });
    }

    const verification = await verifyEventRequestToken(token);
    if (!verification) {
      return NextResponse.json({ error: 'This verification link has expired or is invalid.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error('Event request verification lookup error:', error);
    return NextResponse.json({ error: 'Unable to verify this link.' }, { status: 500 });
  }
}
