import { useState } from 'react'
import axios from 'axios'
import './Auth.css'

const AUTH_API_URL = 'http://localhost:5000/api/auth'
const ACCOUNTS_API_URL = 'http://localhost:5000/api/accounts'

interface AuthProps {
  onLoginSuccess: (userData: { id: number; accountNumber: string }) => void
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [accountNumber, setAccountNumber] = useState('')
  const [pin, setPin] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [newAccountPin, setNewAccountPin] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountNumber.trim() || !pin.trim()) {
      setMessage('Please enter account number and PIN')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        accountNumber: accountNumber.trim(),
        pin: pin.trim()
      })
      setMessage(response.data.message)
      onLoginSuccess(response.data.user)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message || 'Login failed'
        setMessage(`Error: ${errorMsg}`)
      } else {
        setMessage('Error: Network or connection error')
      }
    }
    setLoading(false)
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountNumber.trim() || !newAccountBalance.trim() || !newAccountPin.trim()) {
      setMessage('Please fill in all fields')
      return
    }
    if (newAccountPin.length < 4) {
      setMessage('PIN must be at least 4 characters')
      return
    }
    if (isNaN(parseFloat(newAccountBalance)) || parseFloat(newAccountBalance) < 0) {
      setMessage('Balance must be a valid positive number')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${ACCOUNTS_API_URL}/create`, {
        accountNumber: newAccountNumber.trim(),
        accountType: 'GENERAL',
        balance: parseFloat(newAccountBalance),
        pin: newAccountPin.trim()
      })
      setMessage(`Success! Account ${newAccountNumber} created. You can now login.`)
      setNewAccountNumber('')
      setNewAccountBalance('')
      setNewAccountPin('')
      setTimeout(() => setMode('login'), 2000)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message || 'Account creation failed'
        setMessage(`Error: ${errorMsg}`)
      } else {
        setMessage('Error: Network or connection error')
      }
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>💰 Account Balance System</h1>
        
        <div className="auth-toggle">
          <button
            className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login')
              setMessage('')
              setAccountNumber('')
              setPin('')
            }}
          >
            Login
          </button>
          <button
            className={`toggle-btn ${mode === 'create' ? 'active' : ''}`}
            onClick={() => {
              setMode('create')
              setMessage('')
              setNewAccountNumber('')
              setNewAccountBalance('')
            }}
          >
            Create Account
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Login to Your Account</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="PIN (4+ digits)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount} className="auth-form">
            <h2>Create New Account</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Account Number"
                value={newAccountNumber}
                onChange={(e) => setNewAccountNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Initial Balance"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Create PIN (4+ digits)"
                value={newAccountPin}
                onChange={(e) => setNewAccountPin(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
