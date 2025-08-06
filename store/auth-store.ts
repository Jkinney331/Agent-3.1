import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import CryptoJS from 'crypto-js'
import { validateApiCredentials } from '@/lib/api/auth'

interface AuthCredentials {
  apiKey: string
  secretKey: string
}

interface AuthState {
  isAuthenticated: boolean
  credentials: AuthCredentials | null
  user: {
    id: string
    email?: string
  } | null
  login: (apiKey: string, secretKey: string, twoFactorCode?: string) => Promise<boolean>
  logout: () => void
  getDecryptedCredentials: () => AuthCredentials | null
}

// Encryption key derived from environment or a secure method
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'trading-bot-secure-key-2024'

const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      credentials: null,
      user: null,

      login: async (apiKey: string, secretKey: string, twoFactorCode?: string): Promise<boolean> => {
        try {
          // Validate credentials using the auth API
          const isValid = await validateApiCredentials({ apiKey, secretKey })
          
          if (!isValid) {
            return false
          }

          // Encrypt credentials before storing
          const encryptedCredentials = {
            apiKey: encryptData(apiKey),
            secretKey: encryptData(secretKey),
          }

          set({
            isAuthenticated: true,
            credentials: encryptedCredentials,
            user: {
              id: 'trading-user',
              email: 'trader@tradingbot.com',
            },
          })
          
          return true
        } catch (error) {
          console.error('Failed to login:', error)
          return false
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          credentials: null,
          user: null,
        })
      },

      getDecryptedCredentials: (): AuthCredentials | null => {
        const state = get()
        if (!state.credentials || !state.isAuthenticated) {
          return null
        }

        try {
          return {
            apiKey: decryptData(state.credentials.apiKey),
            secretKey: decryptData(state.credentials.secretKey),
          }
        } catch (error) {
          console.error('Failed to decrypt credentials:', error)
          return null
        }
      },
    }),
    {
      name: 'trading-bot-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        credentials: state.credentials,
        user: state.user,
      }),
    }
  )
) 