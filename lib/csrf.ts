import { cookies } from "next/headers"

const CSRF_SECRET = process.env.CSRF_SECRET!

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  return bufferToHex(hashBuffer)
}

export async function generateCsrfToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const raw = bufferToHex(array.buffer)
  const token = await sha256(`${raw}${CSRF_SECRET}`)
  return `${raw}:${token}`
}

export async function validateCsrfToken(fullToken: string): Promise<boolean> {
  const [raw, token] = fullToken.split(":")
  if (!raw || !token) return false
  const expected = await sha256(`${raw}${CSRF_SECRET}`)
  return expected === token
}

export async function setCsrfCookie() {
  const cookieStore = await cookies()
  const token = await generateCsrfToken()
  cookieStore.set("csrf_token", token, {
    httpOnly: false,
    secure: true,
    path: "/",
  })
}
