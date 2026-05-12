import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <main className="notfound-page">
      <h1>404</h1>
      <p>Page not found</p>
      <div className="notfound-actions">
        <Link to="/dashboard">Go to Dashboard</Link>
        <Link to="/">Login</Link>
      </div>
    </main>
  )
}
