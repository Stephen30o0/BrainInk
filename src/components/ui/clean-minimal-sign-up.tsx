"use client"

import * as React from "react"
import { useState } from "react"
import { UserPlus, Lock, Mail, User } from "lucide-react"

interface SignUp2Props {
  onSignUp?: (firstName: string, lastName: string, username: string, email: string, password: string) => void
  onGoogleSignUp?: () => void
  isLoading?: boolean
  error?: string
  title?: string
  subtitle?: string
  buttonText?: string
  mode?: 'login' | 'signup'
  onModeChange?: (mode: 'login' | 'signup') => void
}

const SignUp2: React.FC<SignUp2Props> = ({
  onSignUp,
  onGoogleSignUp,
  isLoading = false,
  error: externalError,
  title,
  subtitle,
  buttonText,
  mode = 'signup',
  onModeChange
}) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [internalError, setInternalError] = useState("")

  const error = externalError || internalError
  const isSignUp = mode === 'signup'

  const defaultTitle = isSignUp ? "Create your account" : "Sign in to your account"
  const defaultSubtitle = isSignUp 
    ? "Join BrainInk to start your learning journey" 
    : "Access your BrainInk account to continue"
  const defaultButtonText = isSignUp ? "Create Account" : "Sign In"

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = () => {
    if (isSignUp) {
      if (!firstName || !lastName || !username || !email || !password) {
        setInternalError("Please fill in all fields.")
        return
      }
      // Only validate email for signup, not login
      if (!validateEmail(email)) {
        setInternalError("Please enter a valid email address.")
        return
      }
    } else {
      if (!username || !password) {
        setInternalError("Please enter both username and password.")
        return
      }
    }
    
    setInternalError("")
    
    if (onSignUp) {
      onSignUp(firstName, lastName, username, email, password)
    } else {
      alert(`${isSignUp ? 'Sign up' : 'Sign in'} successful! (Demo)`)
    }
  }

  const handleGoogleAuth = () => {
    if (onGoogleSignUp) {
      onGoogleSignUp()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white rounded-xl z-1">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 p-8 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg shadow-opacity-5">
          <UserPlus className="w-7 h-7 text-black" />
        </div>
        
        {onModeChange && (
          <div className="flex justify-center mb-6 w-full">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => onModeChange('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  mode === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => onModeChange('signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
        
        <h2 className="text-2xl font-semibold mb-2 text-center">
          {title || defaultTitle}
        </h2>
        <p className="text-gray-500 text-sm mb-6 text-center">
          {subtitle || defaultSubtitle}
        </p>
        
        <div className="w-full flex flex-col gap-3 mb-2">
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    placeholder="First Name"
                    type="text"
                    value={firstName}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="relative">
                  <input
                    placeholder="Last Name"
                    type="text"
                    value={lastName}
                    className="w-full pl-3 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}
          
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
          
          {isSignUp && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                placeholder="Email"
                type="email"
                value={email}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
          
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
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          
          <div className="w-full flex justify-between items-center">
            {error && (
              <div className="text-sm text-red-500 text-left flex-1">{error}</div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-4 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            buttonText || defaultButtonText
          )}
        </button>
        
        <div className="flex items-center w-full my-2">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">Or continue with</span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>
        
        <div className="flex gap-3 w-full justify-center mt-2">
          <button 
            onClick={handleGoogleAuth}
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

export { SignUp2 }
