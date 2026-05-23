'use client';

import { useEffect, useState } from 'react';
import type { Me } from '@studyteach/contracts';

import { StAvatar } from '@/components/st';
import { me as fetchMe } from '@/lib/api/auth';

/**
 * Avatar that pulls the caller's `/me` and derives a Cyrillic initial from
 * their role (and email when the user table starts carrying display names).
 * Replaces the previous hard-coded "С" / "Б" initials on persona top-bars
 * so a logged-in user actually sees the right chip for their role.
 */

const ROLE_INITIAL: Record<Me['primary_role'], string> = {
  STUDENT: 'С',
  TEACHER: 'Б',
  PARENT: 'Э',
  SCHOOL_ADMIN: 'А',
  PLATFORM_ADMIN: 'П',
};

interface Props {
  /** Visual tone for the chip — must match StAvatar's AvatarTone union. */
  tone: 'ember' | 'brass' | 'sky' | 'moss';
  /** Pixel size; defaults to 32 to match the existing top-bars. */
  size?: number;
  /** Fallback initial while /me is still resolving. */
  fallback?: string;
}

export function MeAvatar({ tone, size = 32, fallback = '·' }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchMe().then((m) => {
      if (!cancelled) setMe(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const initial = me ? deriveInitial(me) : fallback;
  return <StAvatar initial={initial} tone={tone} size={size} />;
}

function deriveInitial(me: Me): string {
  return ROLE_INITIAL[me.primary_role] ?? '·';
}
