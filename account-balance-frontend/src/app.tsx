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
  const [view, setView] = useState<'banking' | 'database'>('banking')
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountNumber, setAccountNumber] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [depositAccountNumber, setDepositAccountNumber] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [transferFrom, setTransferFrom] = useState('')
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
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserData(null)
    setView('banking')
    setAccountNumber('')
    setBalance(null)
    setDepositAccountNumber('')
    setDepositAmount('')
    setWithdrawAccountNumber('')
    setWithdrawAmount('')
    setTransferFrom('')
    setTransferTo('')
    setTransferAmount('')
    setMessage('')
  }

  const handleGetBalance = async () => {
    if (!accountNumber.trim()) {
      setMessage('Please enter account number')
      return
    }
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/${accountNumber}/balance`)
      setBalance(response.data.balance)
      setMessage(`Balance for account ${accountNumber}: $${response.data.balance}`)
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
      setBalance(null)
    }
    setLoading(false)
  }

  const handleDeposit = async () => {
    if (!depositAccountNumber.trim() || !depositAmount.trim()) {
      setMessage('Please enter account number and amount')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/${depositAccountNumber}/deposit`, {
        amount: parseFloat(depositAmount)
      })
      setBalance(response.data.balance)
      setMessage(`Deposit successful! New balance: $${response.data.balance}`)
      setDepositAccountNumber('')
      setDepositAmount('')
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
    }
    setLoading(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawAccountNumber.trim() || !withdrawAmount.trim()) {
      setMessage('Please enter account number and amount')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/${withdrawAccountNumber}/withdraw`, {
        amount: parseFloat(withdrawAmount)
      })
      setBalance(response.data.balance)
      setMessage(`Withdrawal successful! New balance: $${response.data.balance}`)
      setWithdrawAccountNumber('')
      setWithdrawAmount('')
    } catch (error: unknown) {
      const errorMsg = axios.isAxiosError(error) ? error.response?.data?.error : 'Unknown error'
      setMessage(`Error: ${errorMsg}`)
    }
    setLoading(false)
  }

  const handleTransfer = async () => {
    if (!transferFrom.trim() || !transferTo.trim() || !transferAmount.trim()) {
      setMessage('Please fill in all transfer fields')
      return
    }
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/transfer`, {
        fromAccount: transferFrom,
        toAccount: transferTo,
        amount: parseFloat(transferAmount)
      })
      setMessage(`Transfer successful! From: $${response.data.fromAccount.balance}, To: $${response.data.toAccount.balance}`)
      setTransferFrom('')
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
            <h2>Check Balance</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
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
                type="text"
                placeholder="Account Number"
                value={depositAccountNumber}
                onChange={(e) => setDepositAccountNumber(e.target.value)}
              />
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
                type="text"
                placeholder="Account Number"
                value={withdrawAccountNumber}
                onChange={(e) => setWithdrawAccountNumber(e.target.value)}
              />
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
                placeholder="From Account"
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
              />
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
                  <td>${parseFloat(acc.balance).toFixed(2)}</td>
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
