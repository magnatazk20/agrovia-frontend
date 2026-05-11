import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <main className="notfound-page">
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/dashboard">Go to Dashboard</Link>
      <br />
      <Link to="/">Login</Link>
    </main>
  )
}