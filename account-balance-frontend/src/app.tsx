import { useState } from 'react'
import axios from 'axios'
import Auth from './Auth'
import './App.css'

const API_URL = 'http://localhost:5000/api/accounts'

interface UserData {
  id: number
  accountNumber: string
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoginSuccess = (user: UserData) => {
    setUserData(user)
    setIsAuthenticated(true)
    setMessage('')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserData(null)
    setBalance(null)
    setDepositAmount('')
    setWithdrawAmount('')
    setTransferTo('')
    setTransferAmount('')
    setMessage('')
  }

  const handleGetBalance = async () => {
    if (!userData?.accountNumber) return
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/${userData.accountNumber}/balance`)
      setBalance(response.data.balance)
      setMessage(`Balance for account ${userData.accountNumber}: $${response.data.balance}`)
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
      setBalance(null)
    }
    setLoading(false)
  }

  const handleDeposit = async () => {
    if (!userData?.accountNumber || !depositAmount.trim()) {
      setMessage('Please enter amount')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/${userData.accountNumber}/deposit`, {
        amount: parseFloat(depositAmount)
      })
      setBalance(response.data.balance)
      setMessage(`Deposit successful! New balance: $${response.data.balance}`)
      setDepositAmount('')
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
    }
    setLoading(false)
  }

  const handleWithdraw = async () => {
    if (!userData?.accountNumber || !withdrawAmount.trim()) {
      setMessage('Please enter amount')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/${userData.accountNumber}/withdraw`, {
        amount: parseFloat(withdrawAmount)
      })
      setBalance(response.data.balance)
      setMessage(`Withdrawal successful! New balance: $${response.data.balance}`)
      setWithdrawAmount('')
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
    }
    setLoading(false)
  }

  const handleTransfer = async () => {
    if (!userData?.accountNumber || !transferTo.trim() || !transferAmount.trim()) {
      setMessage('Please fill in all transfer fields')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/transfer`, {
        fromAccount: userData.accountNumber,
        toAccount: transferTo,
        amount: parseFloat(transferAmount)
      })
      setMessage(`Transfer successful! From: $${response.data.fromAccount.balance}, To: $${response.data.toAccount.balance}`)
      setTransferTo('')
      setTransferAmount('')
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
    }
    setLoading(false)
  }



  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="container">
      <div className="header">
        <h1>💰 Account Balance System</h1>
        <div className="user-info">
          <span>Welcome, {userData?.accountNumber}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      {message && <div className="message">{message}</div>}

      <div className="section">
        <h2>Check Balance</h2>
        <div className="form-group">
          <p>Click below to check your current balance for account {userData?.accountNumber}.</p>
          <button onClick={handleGetBalance} disabled={loading}>
            {loading ? 'Loading...' : 'Check Balance'}
          </button>
        </div>
        {balance !== null && <p className="result">Current Balance: ${balance.toFixed(2)}</p>}
      </div>

      <div className="section">
        <h2>Deposit</h2>
        <div className="form-group">
          <input
            type="number"
            placeholder="Amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button onClick={handleDeposit} disabled={loading}>
            {loading ? 'Processing...' : 'Deposit'}
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Withdraw</h2>
        <div className="form-group">
          <input
            type="number"
            placeholder="Amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button onClick={handleWithdraw} disabled={loading}>
            {loading ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Transfer</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="To Account"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
          <button onClick={handleTransfer} disabled={loading}>
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      </div>


    </div>
  )
}
