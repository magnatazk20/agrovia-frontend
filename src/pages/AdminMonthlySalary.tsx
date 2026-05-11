import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import './Admin.css'

type MonthlySalaryPlan = {
  id: number
  title: string
  imageUrl: string
  monthlySalary: number
  requiredLevel1Deposited: number
  requiredLevel2Deposited: number
  requiredLevel3Deposited: number
  isActive: boolean
  sortOrder: number
}

type FormState = {
  title: string
  imageUrl: string
  monthlySalary: string
  requiredLevel1Deposited: string
  requiredLevel2Deposited: string
  requiredLevel3Deposited: string
  isActive: boolean
  sortOrder: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

const emptyForm: FormState = {
  title: '',
  imageUrl: '',
  monthlySalary: '',
  requiredLevel1Deposited: '0',
  requiredLevel2Deposited: '0',
  requiredLevel3Deposited: '0',
  isActive: true,
  sortOrder: '0',
}

const formatBRL = (value: number) =>
  Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminMonthlySalary() {
  const [plans, setPlans] = useState<MonthlySalaryPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const token = useMemo(() => localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '', [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const loadPlans = async () => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/monthly-salary-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json() as {
        ok?: boolean
        error?: string
        plans?: Array<{
          id?: number
          title?: string
          imageUrl?: string
          monthlySalary?: number
          requiredLevel1Deposited?: number
          requiredLevel2Deposited?: number
          requiredLevel3Deposited?: number
          isActive?: boolean
          sortOrder?: number
        }>
      }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao carregar planos.' })
        setPlans([])
        return
      }

      const mapped: MonthlySalaryPlan[] = Array.isArray(data.plans)
        ? data.plans.map((item) => ({
            id: Number(item.id ?? 0),
            title: String(item.title ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
            monthlySalary: Number(item.monthlySalary ?? 0),
            requiredLevel1Deposited: Number(item.requiredLevel1Deposited ?? 0),
            requiredLevel2Deposited: Number(item.requiredLevel2Deposited ?? 0),
            requiredLevel3Deposited: Number(item.requiredLevel3Deposited ?? 0),
            isActive: Boolean(item.isActive),
            sortOrder: Number(item.sortOrder ?? 0),
          }))
        : []

      setPlans(mapped)
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao carregar planos.' })
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const fillEditForm = (plan: MonthlySalaryPlan) => {
    setEditingId(plan.id)
    setForm({
      title: plan.title,
      imageUrl: plan.imageUrl,
      monthlySalary: String(plan.monthlySalary),
      requiredLevel1Deposited: String(plan.requiredLevel1Deposited),
      requiredLevel2Deposited: String(plan.requiredLevel2Deposited),
      requiredLevel3Deposited: String(plan.requiredLevel3Deposited),
      isActive: plan.isActive,
      sortOrder: String(plan.sortOrder),
    })
    setFeedback(null)
  }

  const handleSave = async () => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const title = form.title.trim()
    const imageUrl = form.imageUrl.trim()
    const monthlySalary = Number(form.monthlySalary.replace(',', '.'))
    const level1 = Number(form.requiredLevel1Deposited.replace(',', '.'))
    const level2 = Number(form.requiredLevel2Deposited.replace(',', '.'))
    const level3 = Number(form.requiredLevel3Deposited.replace(',', '.'))
    const sortOrder = Number(form.sortOrder.replace(',', '.'))

    if (!title) {
      setFeedback({ type: 'error', text: 'Informe o título do plano.' })
      return
    }

    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) {
      setFeedback({ type: 'error', text: 'Informe um salário mensal válido.' })
      return
    }

    if (!Number.isInteger(level1) || level1 < 0 || !Number.isInteger(level2) || level2 < 0 || !Number.isInteger(level3) || level3 < 0) {
      setFeedback({ type: 'error', text: 'Os requisitos de níveis devem ser inteiros >= 0.' })
      return
    }

    if (!Number.isInteger(sortOrder)) {
      setFeedback({ type: 'error', text: 'A ordem deve ser um número inteiro.' })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const isEditing = editingId != null
      const endpoint = isEditing
        ? `${API_URL}/api/admin/monthly-salary-plans/${editingId}`
        : `${API_URL}/api/admin/monthly-salary-plans`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          imageUrl,
          monthlySalary: Number(monthlySalary.toFixed(2)),
          requiredLevel1Deposited: level1,
          requiredLevel2Deposited: level2,
          requiredLevel3Deposited: level3,
          isActive: form.isActive,
          sortOrder,
        }),
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao salvar plano.' })
        return
      }

      setFeedback({
        type: 'success',
        text: data?.message || (isEditing ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.'),
      })

      resetForm()
      await loadPlans()
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao salvar plano.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plan: MonthlySalaryPlan) => {
    if (!token) {
      setFeedback({ type: 'error', text: 'Token não encontrado. Faça login novamente.' })
      return
    }

    const confirmed = window.confirm(`Deseja realmente apagar o plano "${plan.title}"?`)
    if (!confirmed) return

    setDeletingId(plan.id)
    setFeedback(null)

    try {
      const res = await fetch(`${API_URL}/api/admin/monthly-salary-plans/${plan.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json() as { ok?: boolean; error?: string; message?: string }

      if (!res.ok || !data?.ok) {
        setFeedback({ type: 'error', text: data?.error || 'Erro ao apagar plano.' })
        return
      }

      setFeedback({ type: 'success', text: data?.message || 'Plano apagado com sucesso.' })
      if (editingId === plan.id) resetForm()
      await loadPlans()
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão ao apagar plano.' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="admin-page">
      <AdminSidebar />
      <section className="admin-content admin-users-page">
        <header className="admin-users-header">
          <div>
            <h1>Salário Mensal (Admin)</h1>
            <p className="admin-subtitle">Gerencie planos de salário mensal: adicionar, editar e apagar.</p>
          </div>
          <div className="admin-header-meta">
            <span className="admin-chip">Total: {plans.length}</span>
          </div>
        </header>

        <section className="admin-panel admin-cycle-form-panel">
          <h3 className="admin-cycle-form-title">{editingId ? 'Editar Plano' : 'Novo Plano'}</h3>

          <div className="admin-cycle-form-grid">
            <div className="admin-cycle-field">
              <label>Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex.: Start V1"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Foto do plano (URL)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="admin-cycle-field">
              <label>Salário mensal (R$)</label>
              <input
                type="text"
                value={form.monthlySalary}
                onChange={(e) => setForm((prev) => ({ ...prev, monthlySalary: e.target.value }))}
                placeholder="Ex.: 100.00"
              />
            </div>

            <div className="admin-cycle-field">
              <label>Requisito nível 1 (depositados)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.requiredLevel1Deposited}
                onChange={(e) => setForm((prev) => ({ ...prev, requiredLevel1Deposited: e.target.value }))}
              />
            </div>

            <div className="admin-cycle-field">
              <label>Requisito nível 2 (depositados)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.requiredLevel2Deposited}
                onChange={(e) => setForm((prev) => ({ ...prev, requiredLevel2Deposited: e.target.value }))}
              />
            </div>

            <div className="admin-cycle-field">
              <label>Requisito nível 3 (depositados)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.requiredLevel3Deposited}
                onChange={(e) => setForm((prev) => ({ ...prev, requiredLevel3Deposited: e.target.value }))}
              />
            </div>

            <div className="admin-cycle-field">
              <label>Ordem</label>
              <input
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>

            <div className="admin-cycle-field full">
              <label className="admin-cycle-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Plano ativo
              </label>
            </div>
          </div>

          <div className="admin-cycle-actions">
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
            </button>
            {editingId ? (
              <button type="button" className="btn ghost" onClick={resetForm} disabled={saving}>
                Cancelar edição
              </button>
            ) : null}
          </div>
        </section>

        {feedback ? (
          <div className={`gift-toast ${feedback.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="polite">
            {feedback.text}
          </div>
        ) : null}

        {loading ? (
          <div className="vip-inline-message">Carregando planos...</div>
        ) : !plans.length ? (
          <div className="vip-inline-message">Nenhum plano encontrado.</div>
        ) : (
          <section className="admin-panel admin-cycle-list-panel">
            <div className="admin-cycle-list">
              {plans.map((plan) => (
                <article key={plan.id} className="admin-cycle-item">
                  <div className="admin-cycle-item-head">
                    <div>
                      <strong className="admin-cycle-item-title">{plan.title}</strong>
                      <p className="admin-cycle-item-meta">
                        Salário: {formatBRL(plan.monthlySalary)} • N1: {plan.requiredLevel1Deposited} • N2: {plan.requiredLevel2Deposited} • N3: {plan.requiredLevel3Deposited}
                      </p>
                      {plan.imageUrl ? (
                        <p className="admin-cycle-item-meta secondary">
                          Foto: <a href={plan.imageUrl} target="_blank" rel="noreferrer">{plan.imageUrl}</a>
                        </p>
                      ) : null}
                      <p className="admin-cycle-item-meta secondary">
                        Status: {plan.isActive ? 'Ativo' : 'Inativo'} • Ordem: {plan.sortOrder}
                      </p>
                    </div>
                    <div className="admin-cycle-item-actions">
                      <button type="button" className="btn ghost" onClick={() => fillEditForm(plan)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn admin-cycle-delete-btn"
                        onClick={() => handleDelete(plan)}
                        disabled={deletingId === plan.id}
                      >
                        {deletingId === plan.id ? 'Apagando...' : 'Apagar'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
