export function isProfileComplete(user: {
  nickname?: string | null
  gender?: string | null
  birthYear?: number | null
  city?: string | null
  education?: string | null
}): boolean {
  return Boolean(
    user.nickname?.trim() &&
      user.gender &&
      user.birthYear &&
      user.city &&
      user.education,
  )
}

export function resolveStage(opts: {
  user?: {
    nickname?: string | null
    gender?: string | null
    birthYear?: number | null
    city?: string | null
    education?: string | null
    session?: { report?: { identity: string } | null } | null
  } | null
  sessionReportIdentity?: string | null
}): { stage: 'new' | 'played' | 'registered'; identity: string | null } {
  const identity = opts.user?.session?.report?.identity ?? opts.sessionReportIdentity ?? null
  if (opts.user && isProfileComplete(opts.user) && identity) {
    return { stage: 'registered', identity }
  }
  if (identity) return { stage: 'played', identity }
  return { stage: 'new', identity: null }
}
