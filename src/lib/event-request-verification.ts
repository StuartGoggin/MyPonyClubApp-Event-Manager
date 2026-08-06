import { createHash, randomBytes } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

const VERIFICATIONS_COLLECTION = 'eventRequestVerifications';
const VERIFICATION_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

type TimestampLike = { toDate?: () => Date } | Date | undefined;

export interface EventRequestVerification {
  userId: string;
  clubId: string;
  displayName: string;
  email: string;
  tokenHash: string;
  createdAt: TimestampLike;
  expiresAt: TimestampLike;
}

export interface VerifiedEventRequestMember {
  userId: string;
  clubId: string;
  displayName: string;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const hashVerificationToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const asDate = (value: TimestampLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  return value.toDate?.() ?? null;
};

export async function createEventRequestVerification(
  userId: string,
  clubId: string,
  displayName: string,
  email: string,
) {
  if (!adminDb) {
    throw new Error('Database connection unavailable');
  }

  const reference = adminDb.collection(VERIFICATIONS_COLLECTION).doc(userId);
  const existing = await reference.get();
  const createdAt = asDate(existing.data()?.createdAt);

  if (createdAt && Date.now() - createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { token: null, throttled: true };
  }

  const token = randomBytes(32).toString('base64url');
  const now = new Date();

  await reference.set({
    userId,
    clubId,
    displayName,
    email: normalizeEmail(email),
    tokenHash: hashVerificationToken(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + VERIFICATION_TTL_MS),
  });

  return { token, throttled: false };
}

export async function verifyEventRequestToken(
  token: string,
): Promise<VerifiedEventRequestMember | null> {
  if (!adminDb || token.length < 32) {
    return null;
  }

  const snapshot = await adminDb
    .collection(VERIFICATIONS_COLLECTION)
    .where('tokenHash', '==', hashVerificationToken(token))
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const verification = snapshot.docs[0].data() as EventRequestVerification;
  const expiresAt = asDate(verification.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    userId: verification.userId,
    clubId: verification.clubId,
    displayName: verification.displayName,
  };
}
