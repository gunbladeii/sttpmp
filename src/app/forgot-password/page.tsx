"use client"

import { useState } from "react"
import Link from "next/link"
import BrandLogo from "@/components/BrandLogo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    // Call Supabase reset password API
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        setMessage("Arahan reset kata laluan telah dihantar ke email anda.")
      } else {
        setError(data.message || "Ralat berlaku. Sila cuba lagi.")
      }
    } catch (err) {
      setError("Ralat pelayan. Sila cuba lagi.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md w-full space-y-8">
        <BrandLogo variant="page" />
        <div className="cloudpeak-card p-8">
          <h2 className="text-xl font-bold text-slate-200 mb-4 text-center">Reset Kata Laluan</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-600 bg-slate-800/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="nama@moe.gov.my"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="cloudpeak-button w-full py-3 text-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Hantar Reset Kata Laluan"}
            </button>
            {message && <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm">{message}</div>}
            {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">← Kembali ke Log Masuk</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
