import * as React from "react"
import { useState } from "react"
import { LogIn, Lock, User } from "lucide-react"

interface SignIn2Props {
  onSignIn?: (username: string, password: string) => void
  onGoogleSignIn?: () => void
  isLoading?: boolean
  error?: string
  title?: string
  subtitle?: string
  buttonText?: string
  showForgotPassword?: boolean
  onForgotPassword?: () => void
}

const SignIn2: React.FC<SignIn2Props> = ({
  onSignIn,
  onGoogleSignIn,
  isLoading = false,
  error: externalError,
  title = "Sign in with username",
  subtitle = "Access your BrainInk account to continue your learning journey",
  buttonText = "Get Started",
  showForgotPassword = true,
  onForgotPassword
}) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [internalError, setInternalError] = useState("")

  const error = externalError || internalError

  const handleSignIn = () => {
    if (!username || !password) {
      setInternalError("Please enter both username and password.")
      return
    }
    setInternalError("")

    if (onSignIn) {
      onSignIn(username, password)
    } else {
      alert("Sign in successful! (Demo)")
    }
  }

  const handleGoogleSignIn = () => {
    if (onGoogleSignIn) {
      onGoogleSignIn()
    }
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#FAFAF8] relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-stone-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center border border-stone-200/60">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-stone-900 mb-6">
          <LogIn className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-1 text-center text-stone-900 tracking-tight">
          {title}
        </h2>
        <p className="text-stone-500 text-sm mb-6 text-center">
          {subtitle}
        </p>

        <div className="w-full flex flex-col gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <User className="w-4 h-4" />
            </span>
            <input
              placeholder="Username"
              type="text"
              value={username}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 bg-white text-stone-900 text-sm transition-colors"
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 bg-white text-stone-900 text-sm transition-colors"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>

          <div className="w-full flex justify-between items-center">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-1">{error}</div>
            )}
            {showForgotPassword && !error && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs hover:underline font-medium text-blue-600 ml-auto"
              >
                Forgot password?
              </button>
            )}
          </div>
          {showForgotPassword && error && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs hover:underline font-medium text-blue-600"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-2.5 rounded-lg transition-colors mb-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            buttonText
          )}
        </button>

        <div className="flex items-center w-full my-2">
          <div className="flex-grow border-t border-stone-200" />
          <span className="mx-3 text-xs text-stone-400">Or sign in with</span>
          <div className="flex-grow border-t border-stone-200" />
        </div>

        <div className="flex gap-3 w-full justify-center mt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-11 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="ml-2 text-sm font-medium text-stone-700">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export { SignIn2 }
