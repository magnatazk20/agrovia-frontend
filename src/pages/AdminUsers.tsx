import { useEffect, useMemo, useRef, useState } from 'react'
import socketIO from 'socket.io-client'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'
import './AdminUsers.css'

type AdminUser = {
  id: number
  name: string
  phone: string
  is_admin: number
  is_banned: number
  balance?: number
  badges?: string[]
  referred_by_user_id?: number | null
  referrer_name?: string | null
  referrer_phone?: string | null
  created_at?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export default function AdminUsers() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set())

  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null)

  const token = useMemo(
    () => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '',
    []
  )

  // WebSocket para receber lista de usuarios online em tempo real
  useEffect(() => {
    const socket = socketIO(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    socket.on('online-count', (data: { onlineCount?: number; onlineUserIds?: number[] }) => {
      const ids = Array.isArray(data?.onlineUserIds) ? data.onlineUserIds : []
      setOnlineUserIds(new Set(ids))
    })

    // Fallback REST para carga inicial
    fetch(`${API_URL}/api/presence/online-users`)
      .then((r) => r.json())
      .then((d: { ok?: boolean; onlineUserIds?: number[] }) => {
        if (d?.ok && Array.isArray(d.onlineUserIds)) {
          setOnlineUserIds(new Set(d.onlineUserIds))
        }
      })
      .catch(() => {})

    return () => {
      socket.disconnect()
    }
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        users?: AdminUser[]
      }

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Falha ao carregar usuarios.')
        setUsers([])
        return
      }

      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch {
      setError('Erro de conexao ao carregar usuarios.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id)
    setEditName(user.name ?? '')
    setEditPhone(user.phone ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditPhone('')
  }

  const saveEdit = async (id: number) => {
    if (!editName.trim() || !editPhone.trim()) {
      setError('Nome e telefone sao obrigatorios.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
      })

      const data = (await res.json()) as { ok?: boolean; error?: string }

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Falha ao atualizar usuario.')
        return
      }

      await loadUsers()
      cancelEdit()
    } catch {
      setError('Erro de conexao ao atualizar usuario.')
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (id: number) => {
    const confirmed = window.confirm('Deseja realmente apagar este usuario?')
    if (!confirmed) return

    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Falha ao apagar usuario.')
        return
      }
      await loadUsers()
    } catch {
      setError('Erro de conexao ao apagar usuario.')
    }
  }

  const toggleBan = async (user: AdminUser) => {
    setError('')
    try {
      const nextBanned = user.is_banned ? 0 : 1
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_banned: nextBanned }),
      })

      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Falha ao alterar banimento.')
        return
      }

      await loadUsers()
    } catch {
      setError('Erro de conexao ao alterar banimento.')
    }
  }

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) => {
      const name = String(user.name ?? '').toLowerCase()
      const phone = String(user.phone ?? '').toLowerCase()
      return name.includes(term) || phone.includes(term)
    })
  }, [users, searchTerm])

  const totalUsers = users.length
  const usersCreatedToday = users.filter((user) => {
    if (!user.created_at) return false
    const created = new Date(user.created_at)
    const now = new Date()
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    )
  }).length

  return (
    <main className='admin-page'>
      <AdminSidebar />
      <section className='admin-content admin-users-page'>
        <header className='admin-header'>
          <div>
            <h1>Usuarios Cadastrados</h1>
            <p className='admin-subtitle'>Gerencie contas: editar, apagar e banir/desbanir.</p>
          </div>
        </header>

        {error ? <p className='admin-kpi-error'>{error}</p> : null}

        <section className='admin-users-summary-grid'>
          <article className='admin-panel' style={{ gridColumn: '1 / -1' }}>
            <label htmlFor='admin-users-search' style={{ display: 'block', marginBottom: 8, color: '#cbd5e1', fontWeight: 600 }}>
              Buscar por nome ou telefone
            </label>
            <input
              id='admin-users-search'
              className='admin-users-input'
              type='text'
              placeholder='Digite nome ou telefone...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </article>
          <article className='admin-kpi-card'>
            <p>Usuarios no total</p>
            <strong>{totalUsers}</strong>
          </article>
          <article className='admin-kpi-card'>
            <p>Cadastrados hoje</p>
            <strong>{usersCreatedToday}</strong>
          </article>
        </section>

        <section className='admin-panel admin-users-panel'>
          {loading ? (
            <p>Carregando usuarios...</p>
          ) : (
            <div className='admin-users-table-wrap'>
              <table className='admin-table admin-users-table'>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Saldo</th>
                    <th>Emblemas</th>
                    <th>Admin</th>
                    <th>Status</th>
                    <th>Indicado por</th>
                    <th>Criado em</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length ? (
                    filteredUsers.map((user) => {
                      const isEditing = editingId === user.id
                      const isOnline = onlineUserIds.has(user.id)
                      return (
                        <tr key={user.id}>
                          <td>#{user.id}</td>
                          <td>
                            {isEditing ? (
                              <input
                                className='admin-users-input'
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            ) : (
                              <span className='admin-user-name-cell'>
                                <span
                                  className={isOnline ? 'admin-online-dot admin-online-dot--on' : 'admin-online-dot admin-online-dot--off'}
                                  title={isOnline ? 'Online agora' : 'Offline'}
                                />
                                {user.name}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                className='admin-users-input'
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                              />
                            ) : (
                              user.phone
                            )}
                          </td>
                          <td>
                            {Number(user.balance ?? 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td>
                            {Array.isArray(user.badges) && user.badges.length > 0 ? (
                              <div className='admin-user-badges'>
                                {user.badges.map((badge) => (
                                  <span key={`${user.id}-${badge}`} className='admin-user-badge-chip'>
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{user.is_admin ? 'Sim' : 'Nao'}</td>
                          <td>
                            <span className={`status ${user.is_banned ? 'pending' : 'paid'}`}>
                              {user.is_banned ? 'Banido' : 'Ativo'}
                            </span>
                          </td>
                          <td>
                            {user.referred_by_user_id
                              ? `${user.referrer_phone ?? 'Sem telefone'} (#${user.referred_by_user_id})`
                              : '-'}
                          </td>
                          <td>{user.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : '-'}</td>
                          <td>
                            <div className='admin-users-actions'>
                              {isEditing ? (
                                <>
                                  <button type='button' onClick={() => saveEdit(user.id)} disabled={saving}>
                                    Salvar
                                  </button>
                                  <button type='button' className='soft' onClick={cancelEdit} disabled={saving}>
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type='button' className='soft' onClick={() => window.location.assign(`/adf/users/${user.id}`)}>Ver</button>
                                  <button type='button' onClick={() => startEdit(user)}>Editar</button>
                                  <button type='button' className='warn' onClick={() => deleteUser(user.id)}>Apagar</button>
                                  <button type='button' className='soft' onClick={() => toggleBan(user)}>
                                    {user.is_banned ? 'Desbanir' : 'Banir'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={10}>Nenhum usuario encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
