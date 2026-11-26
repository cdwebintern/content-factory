import { GoogleLogin } from "@react-oauth/google"
import { LogOut, ShieldCheck } from "lucide-react"
import { useGoogleAuth } from "@/hooks/useGoogleAuth"
import { clearToken, setToken, SIGN_IN_CONFIGURED } from "@/lib/googleAuth"
import { focusRing } from "@/lib/glass"
import { cn } from "@/lib/utils"

// Google hands back a signed ID token, which the Go backend verifies.
// Without it the backend answers "sign in required" and refuses to save.
export default function SignInCard() {
  const { email, signedIn } = useGoogleAuth()

  // Not an error locally (AUTH_MODE=none), but a deployed backend needs it
  if (!SIGN_IN_CONFIGURED) {
    return (
      <p className="rounded-2xl border border-glass-line bg-glass/60 p-2.5 text-[11px] leading-snug text-ink-muted">
        Google sign-in is off. Set <code>VITE_GOOGLE_CLIENT_ID</code> if your server requires it.
      </p>
    )
  }

  if (signedIn) {
    return (
      <div className="rounded-2xl border border-glass-line bg-glass/60 p-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold text-ink">{email || "Signed in"}</p>
            <p className="text-[11px] text-ink-muted">Changes save to the sheet</p>
          </div>
          <button
            type="button"
            onClick={clearToken}
            aria-label="Sign out of Google"
            title="Sign out"
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent-ink",
              focusRing
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-glass-line bg-glass/60 p-2.5">
      <p className="mb-2 text-[11px] leading-snug text-ink-muted">
        Sign in with Google to save changes to your sheet. Only allowed accounts can edit.
      </p>
      <div className="overflow-hidden rounded-full">
        <GoogleLogin
          shape="pill"
          theme="outline"
          size="medium"
          text="signin_with"
          width={200}
          onSuccess={(response) => {
            if (response.credential) setToken(response.credential)
          }}
          onError={() => {
            // The Google button already shows its own message
          }}
        />
      </div>
    </div>
  )
}
