import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 8

class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  let adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS")

  if (secretKeys) {
    try {
      adminKey = JSON.parse(secretKeys).default || adminKey
    } catch {
      // Gunakan service-role bawaan sebagai fallback untuk proyek lama.
    }
  }

  if (!supabaseUrl || !adminKey) {
    throw new HttpError("Konfigurasi server belum lengkap.", 500)
  }

  return {
    admin: createClient(supabaseUrl, adminKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    adminKey,
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function createSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

async function readJson(request: Request) {
  try {
    return await request.json() as Record<string, unknown>
  } catch {
    throw new HttpError("Format permintaan tidak valid.", 400)
  }
}

function getClientIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown"
}

async function login(request: Request, admin: SupabaseClient, adminKey: string) {
  const body = await readJson(request)
  const secretKey = typeof body.secret_key === "string" ? body.secret_key.trim() : ""

  if (!secretKey || secretKey.length > 128) {
    throw new HttpError("Secret key tidak dikenali.", 401)
  }

  const fingerprint = await sha256(`${adminKey}:${getClientIp(request)}`)
  const now = Date.now()
  const windowCutoff = now - LOGIN_WINDOW_MS
  const { data: attempt, error: attemptError } = await admin
    .from("app_login_attempts")
    .select("attempts, window_started_at")
    .eq("fingerprint", fingerprint)
    .maybeSingle()

  if (attemptError) throw attemptError

  const activeWindow = attempt && new Date(attempt.window_started_at).getTime() > windowCutoff
  if (activeWindow && attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    throw new HttpError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.", 429)
  }

  const { data: user, error: userError } = await admin
    .rpc("verify_app_user", { candidate_secret: secretKey })
    .maybeSingle()

  if (userError) throw userError

  if (!user) {
    const nextAttempt = activeWindow ? attempt.attempts + 1 : 1
    const windowStartedAt = activeWindow ? attempt.window_started_at : new Date(now).toISOString()
    const { error } = await admin.from("app_login_attempts").upsert({
      fingerprint,
      attempts: nextAttempt,
      window_started_at: windowStartedAt,
    })
    if (error) throw error
    throw new HttpError("Secret key tidak dikenali.", 401)
  }

  await admin.from("app_login_attempts").delete().eq("fingerprint", fingerprint)
  await admin.from("app_sessions").delete().lt("expires_at", new Date(now).toISOString())

  const sessionToken = createSessionToken()
  const tokenHash = await sha256(sessionToken)
  const expiresAt = new Date(now + SESSION_DURATION_MS).toISOString()
  const { error: sessionError } = await admin.from("app_sessions").insert({
    token_hash: tokenHash,
    app_user_id: user.app_user_id,
    expires_at: expiresAt,
  })

  if (sessionError) throw sessionError

  return json({
    session_token: sessionToken,
    expires_at: expiresAt,
    user: { id: user.app_user_id, name: user.account_name },
  })
}

async function authenticate(request: Request, admin: SupabaseClient) {
  const authorization = request.headers.get("authorization") || ""
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""

  if (token.length < 32 || token.length > 256) {
    throw new HttpError("Sesi tidak valid. Silakan masuk kembali.", 401)
  }

  const tokenHash = await sha256(token)
  const { data: session, error: sessionError } = await admin
    .from("app_sessions")
    .select("app_user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (sessionError) throw sessionError
  if (!session) throw new HttpError("Sesi tidak valid. Silakan masuk kembali.", 401)

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await admin.from("app_sessions").delete().eq("token_hash", tokenHash)
    throw new HttpError("Sesi sudah berakhir. Silakan masuk kembali.", 401)
  }

  const { data: user, error: userError } = await admin
    .from("app_users")
    .select("id, name, active")
    .eq("id", session.app_user_id)
    .maybeSingle()

  if (userError) throw userError
  if (!user?.active) throw new HttpError("Akun tidak tersedia.", 401)

  await admin.from("app_sessions").update({ last_seen_at: new Date().toISOString() }).eq("token_hash", tokenHash)

  return { tokenHash, user: { id: user.id, name: user.name } }
}

function validateTransaction(body: Record<string, unknown>) {
  const type = body.type
  const category = typeof body.category === "string" ? body.category.trim() : ""
  const amount = Number(body.amount)
  const transactionDate = typeof body.transaction_date === "string" ? body.transaction_date : ""
  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (type !== "income" && type !== "expense") throw new HttpError("Jenis transaksi tidak valid.", 400)
  if (!category || category.length > 50) throw new HttpError("Kategori tidak valid.", 400)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999) throw new HttpError("Nominal tidak valid.", 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) || Number.isNaN(Date.parse(`${transactionDate}T00:00:00Z`))) {
    throw new HttpError("Tanggal transaksi tidak valid.", 400)
  }
  if (note.length > 240) throw new HttpError("Catatan terlalu panjang.", 400)

  return {
    type,
    category,
    amount,
    transaction_date: transactionDate,
    note: note || null,
  }
}

async function transactions(request: Request, admin: SupabaseClient) {
  const session = await authenticate(request, admin)

  if (request.method === "GET") {
    const { data, error } = await admin
      .from("transactions")
      .select("id, type, category, amount, transaction_date, note, created_at")
      .eq("app_user_id", session.user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return json({ transactions: data || [], user: session.user })
  }

  if (request.method === "POST") {
    const values = validateTransaction(await readJson(request))
    const { data, error } = await admin
      .from("transactions")
      .insert({ ...values, app_user_id: session.user.id, user_id: null })
      .select("id, type, category, amount, transaction_date, note, created_at")
      .single()

    if (error) throw error
    return json({ transaction: data }, 201)
  }

  if (request.method === "PATCH") {
    const body = await readJson(request)
    const id = typeof body.id === "string" ? body.id : ""
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new HttpError("Transaksi tidak valid.", 400)
    }

    const values = validateTransaction(body)
    const { data, error } = await admin
      .from("transactions")
      .update(values)
      .eq("app_user_id", session.user.id)
      .eq("id", id)
      .select("id, type, category, amount, transaction_date, note, created_at")
      .maybeSingle()

    if (error) throw error
    if (!data) throw new HttpError("Transaksi tidak ditemukan.", 404)
    return json({ transaction: data })
  }

  if (request.method === "DELETE") {
    const body = await readJson(request)
    let query = admin.from("transactions").delete().eq("app_user_id", session.user.id)

    if (body.all !== true) {
      const id = typeof body.id === "string" ? body.id : ""
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new HttpError("Transaksi tidak valid.", 400)
      }
      query = query.eq("id", id)
    }

    const { error } = await query
    if (error) throw error
    return json({ ok: true })
  }

  throw new HttpError("Metode tidak didukung.", 405)
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { admin, adminKey } = getAdminClient()
    const pathParts = new URL(request.url).pathname.split("/").filter(Boolean)
    const functionIndex = pathParts.lastIndexOf("dompetku-api")
    const route = `/${pathParts.slice(functionIndex + 1).join("/")}`

    if (route === "/login" && request.method === "POST") {
      return await login(request, admin, adminKey)
    }

    if (route === "/logout" && request.method === "POST") {
      const session = await authenticate(request, admin)
      const { error } = await admin.from("app_sessions").delete().eq("token_hash", session.tokenHash)
      if (error) throw error
      return json({ ok: true })
    }

    if (route === "/transactions") return await transactions(request, admin)

    throw new HttpError("Endpoint tidak ditemukan.", 404)
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    console.error(error)
    return json({ error: "Layanan sedang bermasalah. Silakan coba lagi." }, 500)
  }
})
