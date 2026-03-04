import { useState } from 'react'
import axios from 'axios'
import Auth from './Auth'
import './App.css'

const API_URL = 'http://localhost:5000/api/accounts'

interface UserData {
  id: number
  accountNumber: string
}

interface Account {
  id: number
  account_number: string
  account_type: string
  balance: string | number
  created_at: string
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [view, setView] = useState<'banking' | 'database'>('banking')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(API_URL)
      setAccounts(response.data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handleLoginSuccess = (user: UserData) => {
    setUserData(user)
    setIsAuthenticated(true)
    setMessage('')
    // Fetch initial balance on login
    fetchBalance(user.accountNumber)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserData(null)
    setView('banking')
    setBalance(null)
    setDepositAmount('')
    setWithdrawAmount('')
    setTransferTo('')
    setTransferAmount('')
    setMessage('')
  }

  const fetchBalance = async (accNum: string) => {
    try {
      const response = await axios.get(`${API_URL}/${accNum}/balance`)
      setBalance(response.data.balance)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const handleGetBalance = async () => {
    if (!userData) return
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/${userData.accountNumber}/balance`)
      setBalance(response.data.balance)
      setMessage(`Current balance: $${response.data.balance}`)
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
      setBalance(null)
    }
    setLoading(false)
  }

  const handleDeposit = async () => {
    if (!userData || !depositAmount.trim()) {
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
    if (!userData || !withdrawAmount.trim()) {
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
    if (!userData || !transferTo.trim() || !transferAmount.trim()) {
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
      setMessage(`Transfer successful! Your new balance: $${response.data.fromAccount.balance}`)
      setBalance(response.data.fromAccount.balance)
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
        <div className="nav-buttons">
          <button onClick={() => setView('banking')} className={view === 'banking' ? 'active' : ''}>Banking</button>
          <button onClick={() => { setView('database'); fetchAccounts(); }} className={view === 'database' ? 'active' : ''}>Database</button>
        </div>
        <div className="user-info">
          <span>Welcome, {userData?.accountNumber}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      {message && <div className="message">{message}</div>}

      {view === 'banking' ? (
        <>
          <div className="section">
            <h2>Your Current Balance</h2>
            <div className="balance-display">
              {balance !== null ? (
                <div className="balance-amount" style={{ fontSize: '24px', fontWeight: 'bold', color: '#764ba2', margin: '10px 0' }}>
                  ${balance.toFixed(2)}
                </div>
              ) : (
                <p>Loading balance...</p>
              )}
              <button onClick={handleGetBalance} disabled={loading} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
            </div>
          </div>

          <div className="section">
            <h2>Deposit</h2>
            <div className="form-group">
              <input
                type="number"
                placeholder="Amount to Deposit"
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
                placeholder="Amount to Withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <button onClick={handleWithdraw} disabled={loading}>
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>

          <div className="section">
            <h2>Transfer Funds</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Recipient Account Number"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount to Transfer"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <button onClick={handleTransfer} disabled={loading}>
                {loading ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="section">
          <h2>Database View (All Accounts)</h2>
          <table className="db-table">
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id}>
                  <td>{acc.account_number}</td>
                  <td>{acc.account_type}</td>
                  <td>${Number(acc.balance).toFixed(2)}</td>
                  <td>{new Date(acc.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
