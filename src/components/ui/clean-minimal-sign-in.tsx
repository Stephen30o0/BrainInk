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
    <div className="min-h-screen w-full flex items-center justify-center bg-white rounded-xl z-1">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 p-8 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg shadow-opacity-5">
          <LogIn className="w-7 h-7 text-black" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-center">
          {title}
        </h2>
        <p className="text-gray-500 text-sm mb-6 text-center">
          {subtitle}
        </p>
        
        <div className="w-full flex flex-col gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-4 h-4" />
            </span>
            <input
              placeholder="Username"
              type="text"
              value={username}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
          
          <div className="w-full flex justify-between items-center">
            {error && (
              <div className="text-sm text-red-500 text-left flex-1">{error}</div>
            )}
            {showForgotPassword && (
              <button 
                type="button"
                onClick={onForgotPassword}
                className="text-xs hover:underline font-medium text-blue-600 ml-auto"
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            buttonText
          )}
        </button>
        
        <div className="flex items-center w-full my-2">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">Or sign in with</span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>
        
        <div className="flex gap-3 w-full justify-center mt-2">
          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center w-full h-12 rounded-xl border bg-white hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-6 h-6"
            />
            <span className="ml-2 text-sm font-medium">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export { SignIn2 }
