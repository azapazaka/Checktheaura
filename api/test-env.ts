import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const keys = Object.keys(process.env)
  const status = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PUBLISHABLE_KEY: !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    allKeys: keys.filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('PASSWORD')),
  }

  return res.status(200).json(status)
}
