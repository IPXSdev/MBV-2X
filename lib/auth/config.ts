export const SESSION_CONFIG = {
  cookieName: "tmbm-session",
  expiryDays: 7,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
}

export const MASTER_DEV_CREDENTIALS = {
  harris: {
    email: "harris@tmbm.com",
    key: process.env.MASTER_DEV_KEY_HARRIS,
  },
  ipxs: {
    email: "ipxs@tmbm.com",
    key: process.env.MASTER_DEV_KEY_IPXS,
  },
}

export const PASSWORD_CONFIG = {
  minLength: 8,
  saltRounds: 12,
}
