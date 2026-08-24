import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Download,
  LayoutDashboard,
  KeyRound,
  LogOut,
  Menu,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'
import { apiRequest, isSupabaseConfigured } from './lib/api'
import { formatAmountInput, sanitizeAmountInput } from './lib/format'

const sessionStorageKey = 'dompetku_app_session'

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'short' })

const incomeCategories = ['Gaji', 'Freelance', 'Bisnis', 'Investasi', 'Hadiah', 'Lainnya']
const expenseCategories = ['Makanan', 'Transportasi', 'Tagihan', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya']
const chartColors = ['#efaa92', '#8bbdab', '#aaa6dc', '#7daecb', '#e9c76b', '#d38fa5']

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00`))
}

function getMonthKey(date) {
  return date.slice(0, 7)
}

function getMonthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return `${monthFormatter.format(new Date(year, month - 1, 1))} ${String(year).slice(-2)}`
}

function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand__mark" aria-hidden="true">
        <span />
        <span />
      </span>
      {!compact && <span>dompetku</span>}
    </div>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [secretKey, setSecretKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: { secret_key: secretKey },
      })
      onAuthenticated({ token: data.session_token, expiresAt: data.expires_at, user: data.user })
    } catch (error) {
      setMessage(error.message || 'Secret key tidak dikenali.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-story__content">
          <span className="eyebrow"><Sparkles size={14} /> Keuangan terasa lebih ringan</span>
          <h1>Pahami uangmu.<br />Nikmati harimu.</h1>
          <p>Catat setiap arus uang dan lihat kebiasaan finansialmu dalam satu tempat yang tenang.</p>
        </div>
        <div className="auth-preview" aria-hidden="true">
          <div><span>Saldo bulan ini</span><strong>Rp8.865.000</strong></div>
          <div className="auth-preview__bars"><i /><i /><i /><i /><i /><i /></div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-card__mobile-logo"><Logo /></span>
          <span className="auth-card__key-icon"><KeyRound size={22} /></span>
          <p className="overline">AKSES PRIBADI</p>
          <h2>Masuk dengan secret key</h2>
          <p className="muted">Masukkan secret key akunmu. Tidak perlu email atau kata sandi.</p>
          <form onSubmit={handleSubmit}>
            <label>Secret key
              <input
                type="password"
                value={secretKey}
                onChange={(event) => setSecretKey(event.target.value)}
                placeholder="Masukkan secret key"
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck="false"
                required
                autoFocus
              />
            </label>
            {message && <p className="form-message" role="status">{message}</p>}
            <button className="button button--dark button--wide" disabled={loading}>
              {loading ? 'Memeriksa…' : 'Masuk'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-hint">Setiap secret key memiliki data transaksi yang terpisah.</p>
        </div>
      </section>
    </main>
  )
}

function DatabaseConfigurationRequired() {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-story__content">
          <span className="eyebrow"><Sparkles size={14} /> Satu data di semua perangkat</span>
          <h1>Dompet yang sama.<br />Di mana saja.</h1>
          <p>Dompetku menyimpan catatan keuangan di Supabase agar laptop dan ponsel selalu menggunakan sumber data yang sama.</p>
        </div>
        <div className="auth-preview" aria-hidden="true">
          <div><span>Status penyimpanan</span><strong>Database terpusat</strong></div>
          <div className="auth-preview__bars"><i /><i /><i /><i /><i /><i /></div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card config-card">
          <span className="auth-card__mobile-logo"><Logo /></span>
          <span className="config-card__icon"><Settings size={23} /></span>
          <p className="overline">KONFIGURASI DIPERLUKAN</p>
          <h2>Koneksi database belum tersedia</h2>
          <p className="muted">Tambahkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> pada environment deployment, lalu build ulang aplikasi.</p>
        </div>
      </section>
    </main>
  )
}

function Sidebar({ page, setPage, userName, onSignOut }) {
  const navItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ArrowLeftRight },
  ]

  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sidebar__nav" aria-label="Navigasi utama">
        <p>MENU UTAMA</p>
        {navItems.map((item) => (
          <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}>
            <item.icon size={19} /> {item.label}
          </button>
        ))}
        <p className="sidebar__section">AKUN</p>
        <button disabled><Settings size={19} /> Pengaturan <span>Segera</span></button>
        <button disabled><CircleHelp size={19} /> Bantuan</button>
      </nav>
      <div className="sidebar__tip">
        <span><Sparkles size={16} /></span>
        <strong>Tips bulan ini</strong>
        <p>Sisihkan minimal 20% pemasukan untuk tabungan dan investasi.</p>
      </div>
      <div className="sidebar__user">
        <span className="avatar">{(userName || 'D').charAt(0).toUpperCase()}</span>
        <div><strong>{userName || 'Akun Dompetku'}</strong><small>Database tersinkron</small></div>
        <button title="Keluar" aria-label="Keluar" onClick={onSignOut}><LogOut size={17} /></button>
      </div>
    </aside>
  )
}

function MobileHeader({ page, setPage, onAdd, onSignOut }) {
  return (
    <>
      <header className="mobile-header">
        <Logo />
        <div className="mobile-header__actions">
          <button className="icon-button" aria-label="Keluar" title="Keluar" onClick={onSignOut}><LogOut size={18} /></button>
          <button className="icon-button" aria-label="Tambah transaksi" onClick={onAdd}><Plus size={20} /></button>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Navigasi mobile">
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}><LayoutDashboard size={20} /><span>Ringkasan</span></button>
        <button className="bottom-nav__add" onClick={onAdd} aria-label="Tambah transaksi"><Plus size={25} /></button>
        <button className={page === 'transactions' ? 'active' : ''} onClick={() => setPage('transactions')}><ArrowLeftRight size={20} /><span>Transaksi</span></button>
      </nav>
    </>
  )
}

function Topbar({ onAdd }) {
  return (
    <header className="topbar">
      <div />
      <div className="topbar__actions">
        <button className="icon-button" aria-label="Notifikasi"><Bell size={19} /></button>
        <button className="button button--dark" onClick={onAdd}><Plus size={17} /> Catat transaksi</button>
      </div>
    </header>
  )
}

function StatCard({ label, value, tone, icon: Icon, detail }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top"><span>{label}</span><span className="stat-card__icon"><Icon size={18} /></span></div>
      <strong>{currency.format(value)}</strong>
      <p>{detail}</p>
    </article>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => <span key={entry.dataKey} style={{ color: entry.color }}>{entry.name}: {currency.format(entry.value)}</span>)}
    </div>
  )
}

function CategoryIcon({ type, category }) {
  return (
    <span className={`category-icon category-icon--${type}`}>
      {type === 'income' ? <ArrowDownLeft size={17} /> : category === 'Tagihan' ? <ReceiptText size={17} /> : <ArrowUpRight size={17} />}
    </span>
  )
}

function TransactionsTable({ transactions, onEdit, onDelete, compact = false }) {
  if (!transactions.length) {
    return (
      <div className="empty-state">
        <span><ReceiptText size={25} /></span>
        <h3>Belum ada transaksi</h3>
        <p>Coba ubah filter atau catat transaksi pertamamu.</p>
      </div>
    )
  }

  return (
    <div className={`table-wrap ${compact ? 'table-wrap--compact' : ''}`}>
      <table>
        <thead><tr><th>Transaksi</th><th>Kategori</th><th>Tanggal</th><th>Nominal</th><th aria-label="Aksi" /></tr></thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td data-label="Transaksi">
                <div className="transaction-name"><CategoryIcon type={transaction.type} category={transaction.category} /><div><strong>{transaction.note || transaction.category}</strong><small>{transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small></div></div>
              </td>
              <td data-label="Kategori"><span className="category-chip">{transaction.category}</span></td>
              <td data-label="Tanggal">{formatDate(transaction.transaction_date)}</td>
              <td data-label="Nominal" className={`amount amount--${transaction.type}`}>{transaction.type === 'income' ? '+' : '−'}{currency.format(Number(transaction.amount))}</td>
              <td className="row-action">
                <button className="row-action__edit" aria-label={`Edit ${transaction.note || transaction.category}`} title="Edit" onClick={() => onEdit(transaction)}><Pencil size={15} /></button>
                <button className="row-action__delete" aria-label={`Hapus ${transaction.note || transaction.category}`} title="Hapus" onClick={() => onDelete(transaction)}><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Dashboard({ transactions, onEdit, onDelete, onAdd, goToTransactions }) {
  const [filterDate, setFilterDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const years = useMemo(() => [...new Set(transactions.map((item) => item.transaction_date.slice(0, 4)))].sort().reverse(), [transactions])
  const categories = useMemo(() => [...new Set(transactions.map((item) => item.category))].sort((a, b) => a.localeCompare(b, 'id')), [transactions])
  const hasActiveFilters = Boolean(filterDate || filterMonth !== 'all' || filterYear !== 'all' || filterCategory !== 'all')

  const filteredTransactions = useMemo(() => transactions.filter((item) => {
    const [year, month] = item.transaction_date.split('-')
    const periodMatches = filterDate
      ? item.transaction_date === filterDate
      : (filterMonth === 'all' || month === filterMonth) && (filterYear === 'all' || year === filterYear)
    return periodMatches && (filterCategory === 'all' || item.category === filterCategory)
  }), [transactions, filterDate, filterMonth, filterYear, filterCategory])

  const totals = useMemo(() => filteredTransactions.reduce((acc, item) => {
    const amount = Number(item.amount)
    acc[item.type] += amount
    return acc
  }, { income: 0, expense: 0 }), [filteredTransactions])

  const chartData = useMemo(() => {
    const latest = filteredTransactions.length
      ? new Date(`${filteredTransactions.map((item) => item.transaction_date).sort().at(-1)}T00:00:00`)
      : new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(latest.getFullYear(), latest.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return { key, month: getMonthLabel(key), income: 0, expense: 0 }
    })
    const byKey = Object.fromEntries(months.map((item) => [item.key, item]))
    filteredTransactions.forEach((item) => {
      const month = byKey[getMonthKey(item.transaction_date)]
      if (month) month[item.type] += Number(item.amount)
    })
    return months
  }, [filteredTransactions])

  const categoryData = useMemo(() => {
    const grouped = {}
    filteredTransactions.filter((item) => item.type === 'expense').forEach((item) => {
      grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount)
    })
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [filteredTransactions])

  const balance = totals.income - totals.expense
  const savingRate = totals.income ? Math.max(0, Math.round((balance / totals.income) * 100)) : 0

  return (
    <>
      <section className="page-heading">
        <div><p className="overline">RINGKASAN KEUANGAN</p><h1>Halo, bagaimana kabar dompetmu?</h1><p>Pantau setiap rupiah dan buat keputusan yang lebih tenang.</p></div>
        <button className="button button--outline page-heading__add" onClick={onAdd}><Plus size={17} /> Tambah transaksi</button>
      </section>

      <section className="dashboard-filters" aria-label="Filter dashboard">
        <div className="dashboard-filters__heading">
          <span className="dashboard-filters__icon"><CalendarDays size={17} /></span>
          <div><strong>Filter ringkasan</strong><small>{filteredTransactions.length} dari {transactions.length} transaksi ditampilkan</small></div>
        </div>
        <div className="dashboard-filters__controls">
          <label>Tanggal
            <input type="date" value={filterDate} onChange={(event) => { const value = event.target.value; setFilterDate(value); if (value) { setFilterMonth('all'); setFilterYear('all') } }} />
          </label>
          <label>Bulan
            <span className="select-control"><select value={filterMonth} onChange={(event) => setFilterMonth(event.target.value)} disabled={Boolean(filterDate)}><option value="all">Semua bulan</option>{Array.from({ length: 12 }, (_, index) => { const value = String(index + 1).padStart(2, '0'); return <option key={value} value={value}>{new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2026, index, 1))}</option> })}</select><ChevronDown size={14} /></span>
          </label>
          <label>Tahun
            <span className="select-control"><select value={filterYear} onChange={(event) => setFilterYear(event.target.value)} disabled={Boolean(filterDate)}><option value="all">Semua tahun</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select><ChevronDown size={14} /></span>
          </label>
          <label>Kategori
            <span className="select-control"><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}><option value="all">Semua kategori</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={14} /></span>
          </label>
          {hasActiveFilters && <button className="filter-reset" onClick={() => { setFilterDate(''); setFilterMonth('all'); setFilterYear('all'); setFilterCategory('all') }}><X size={14} /> Reset</button>}
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Total saldo" value={balance} tone="cream" icon={WalletCards} detail={`${savingRate}% dari pemasukan masih tersimpan`} />
        <StatCard label="Total pemasukan" value={totals.income} tone="sage" icon={TrendingUp} detail={`${filteredTransactions.filter((item) => item.type === 'income').length} transaksi masuk`} />
        <StatCard label="Total pengeluaran" value={totals.expense} tone="peach" icon={TrendingDown} detail={`${filteredTransactions.filter((item) => item.type === 'expense').length} transaksi keluar`} />
      </section>

      <section className="dashboard-grid">
        <article className="panel cashflow-panel">
          <div className="panel__header"><div><p className="overline">ARUS KAS</p><h2>Perjalanan 6 bulan</h2></div><div className="legend"><span className="legend--income">Pemasukan</span><span className="legend--expense">Pengeluaran</span></div></div>
          <div className="cashflow-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#78ad9a" stopOpacity={0.34}/><stop offset="95%" stopColor="#78ad9a" stopOpacity={0}/></linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ee9d84" stopOpacity={0.28}/><stop offset="95%" stopColor="#ee9d84" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid stroke="#e8e5dc" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#7a7d78', fontSize: 12 }} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#7a7d78', fontSize: 11 }} tickFormatter={(value) => compactCurrency.format(value)} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#679b88" strokeWidth={2.5} fill="url(#incomeFill)" />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#e78f75" strokeWidth={2.5} fill="url(#expenseFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel spending-panel">
          <div className="panel__header"><div><p className="overline">PENGELUARAN</p><h2>Berdasarkan kategori</h2></div></div>
          {categoryData.length ? (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={categoryData} innerRadius={57} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">{categoryData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => currency.format(value)} /></PieChart>
                </ResponsiveContainer>
                <div className="donut-center"><strong>{currency.format(totals.expense).replace('Rp', '').trim()}</strong><span>Total</span></div>
              </div>
              <div className="category-legend">
                {categoryData.map((item, index) => <div key={item.name}><span style={{ background: chartColors[index % chartColors.length] }} /><p>{item.name}<small>{Math.round((item.value / totals.expense) * 100)}%</small></p><strong>{compactCurrency.format(item.value)}</strong></div>)}
              </div>
            </>
          ) : <div className="empty-mini">Belum ada data pengeluaran.</div>}
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel__header"><div><p className="overline">AKTIVITAS TERBARU</p><h2>Transaksi terakhir</h2></div><button className="text-link" onClick={goToTransactions}>Lihat semuanya <ArrowRight size={15} /></button></div>
        <TransactionsTable transactions={filteredTransactions.slice(0, 6)} onEdit={onEdit} onDelete={onDelete} compact />
      </section>
    </>
  )
}

function TransactionsPage({ transactions, onEdit, onDelete, onDeleteAll, onAdd }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [month, setMonth] = useState('all')

  const months = useMemo(() => [...new Set(transactions.map((item) => getMonthKey(item.transaction_date)))].sort().reverse(), [transactions])
  const filtered = useMemo(() => transactions.filter((item) => {
    const query = search.toLowerCase()
    return (type === 'all' || item.type === type)
      && (month === 'all' || getMonthKey(item.transaction_date) === month)
      && (`${item.note} ${item.category}`.toLowerCase().includes(query))
  }), [transactions, search, type, month])

  function exportCsv() {
    const rows = [
      ['Tanggal', 'Tipe', 'Kategori', 'Catatan', 'Nominal'],
      ...filtered.map((item) => [item.transaction_date, item.type === 'income' ? 'Pemasukan' : 'Pengeluaran', item.category, item.note || '', item.amount]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'transaksi-dompetku.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section className="page-heading page-heading--transactions">
        <div><p className="overline">RIWAYAT KEUANGAN</p><h1>Semua transaksi</h1><p>Temukan, filter, dan tinjau seluruh pergerakan uangmu.</p></div>
        <div className="heading-actions">
          <button className="button button--danger-outline" onClick={onDeleteAll} disabled={!transactions.length}><Trash2 size={17} /> Hapus semua</button>
          <button className="button button--outline" onClick={exportCsv} disabled={!filtered.length}><Download size={17} /> Ekspor CSV</button>
          <button className="button button--dark" onClick={onAdd}><Plus size={17} /> Catat transaksi</button>
        </div>
      </section>
      <section className="panel transactions-panel">
        <div className="filters">
          <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari transaksi…" /></label>
          <div className="filter-group">
            <label><span className="sr-only">Filter tipe</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">Semua tipe</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select><ChevronDown size={15} /></label>
            <label><CalendarDays size={16} /><span className="sr-only">Filter bulan</span><select value={month} onChange={(event) => setMonth(event.target.value)}><option value="all">Semua bulan</option>{months.map((item) => <option key={item} value={item}>{getMonthLabel(item)}</option>)}</select><ChevronDown size={15} /></label>
          </div>
        </div>
        <div className="result-count"><strong>{filtered.length}</strong> transaksi ditemukan</div>
        <TransactionsTable transactions={filtered} onEdit={onEdit} onDelete={onDelete} />
      </section>
    </>
  )
}

function DeleteAllModal({ count, onClose, onConfirm, deleting }) {
  const [confirmation, setConfirmation] = useState('')
  const isConfirmed = confirmation.trim().toUpperCase() === 'HAPUS'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !deleting && onClose()}>
      <section className="modal danger-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-all-title" aria-describedby="delete-all-description">
        <div className="danger-modal__icon"><Trash2 size={24} /></div>
        <div className="modal__header">
          <div><p className="overline">TINDAKAN PERMANEN</p><h2 id="delete-all-title">Hapus semua transaksi?</h2></div>
          <button className="icon-button" aria-label="Tutup" onClick={onClose} disabled={deleting}><X size={20} /></button>
        </div>
        <p id="delete-all-description" className="danger-modal__description">
          Seluruh <strong>{count} transaksi</strong> beserta riwayat pemasukan dan pengeluaran akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <label className="danger-confirmation">
          Ketik <strong>HAPUS</strong> untuk melanjutkan
          <input
            autoFocus
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="HAPUS"
            autoComplete="off"
            disabled={deleting}
          />
        </label>
        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={deleting}>Batal</button>
          <button type="button" className="button button--danger" onClick={onConfirm} disabled={!isConfirmed || deleting}>
            <Trash2 size={17} /> {deleting ? 'Menghapus…' : 'Hapus semua transaksi'}
          </button>
        </div>
      </section>
    </div>
  )
}

function TransactionModal({ transaction, onClose, onSave, saving }) {
  const today = new Date().toISOString().slice(0, 10)
  const isEditing = Boolean(transaction)
  const [form, setForm] = useState(() => transaction ? {
    type: transaction.type,
    category: transaction.category,
    amount: String(Math.trunc(Number(transaction.amount))),
    transaction_date: transaction.transaction_date,
    note: transaction.note || '',
  } : { type: 'expense', category: expenseCategories[0], amount: '', transaction_date: today, note: '' })
  const categories = form.type === 'income' ? incomeCategories : expenseCategories

  function changeType(type) {
    setForm((current) => ({ ...current, type, category: type === 'income' ? incomeCategories[0] : expenseCategories[0] }))
  }

  function submit(event) {
    event.preventDefault()
    onSave({ ...form, amount: Number(form.amount) })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal__header"><div><p className="overline">{isEditing ? 'PERBARUI CATATAN' : 'CATAT ARUS UANG'}</p><h2 id="modal-title">{isEditing ? 'Edit transaksi' : 'Transaksi baru'}</h2></div><button className="icon-button" aria-label="Tutup" onClick={onClose} disabled={saving}><X size={20} /></button></div>
        <form onSubmit={submit}>
          <div className="type-toggle">
            <button type="button" className={form.type === 'expense' ? 'active expense' : ''} onClick={() => changeType('expense')}><ArrowUpRight size={18} /> Pengeluaran</button>
            <button type="button" className={form.type === 'income' ? 'active income' : ''} onClick={() => changeType('income')}><ArrowDownLeft size={18} /> Pemasukan</button>
          </div>
          <label className="amount-field">Nominal
            <span><b>Rp</b><input autoFocus type="text" inputMode="numeric" autoComplete="off" value={formatAmountInput(form.amount)} onChange={(event) => setForm({ ...form, amount: sanitizeAmountInput(event.target.value) })} placeholder="0" required /></span>
          </label>
          <div className="form-grid">
            <label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Tanggal<input type="date" value={form.transaction_date} onChange={(event) => setForm({ ...form, transaction_date: event.target.value })} required /></label>
          </div>
          <label>Catatan <span className="optional">opsional</span><textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} maxLength={240} placeholder="Contoh: Belanja mingguan di pasar" rows={3} /></label>
          <div className="modal__actions"><button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>Batal</button><button className="button button--dark" disabled={saving}>{saving ? 'Menyimpan…' : isEditing ? 'Simpan perubahan' : 'Simpan transaksi'}<ArrowRight size={17} /></button></div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [toast, setToast] = useState('')
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    try {
      const storedSession = JSON.parse(window.localStorage.getItem(sessionStorageKey))
      if (storedSession?.token && storedSession?.user?.id) setSession(storedSession)
    } catch {
      window.localStorage.removeItem(sessionStorageKey)
    } finally {
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!session) return
    let active = true

    async function loadTransactions(showLoading = false) {
      if (showLoading) setLoadingData(true)
      try {
        const data = await apiRequest('/transactions', { token: session.token })
        if (active) setTransactions(data.transactions || [])
      } catch (error) {
        if (!active) return
        if (error.status === 401) clearSession()
        else showToast(`Data belum dapat dimuat: ${error.message}`)
      } finally {
        if (active && showLoading) setLoadingData(false)
      }
    }

    loadTransactions(true)
    const refreshInterval = window.setInterval(() => loadTransactions(false), 8000)
    const refreshOnFocus = () => loadTransactions(false)
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadTransactions(false)
    }
    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      active = false
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [session])

  function setAuthenticatedSession(nextSession) {
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  function clearSession() {
    window.localStorage.removeItem(sessionStorageKey)
    setTransactions([])
    setSession(null)
  }

  async function signOut() {
    try {
      if (session?.token) await apiRequest('/logout', { method: 'POST', token: session.token })
    } catch {
      // Sesi lokal tetap dihapus jika server tidak dapat dijangkau.
    } finally {
      clearSession()
    }
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3600)
  }

  function openAddTransaction() {
    setEditingTransaction(null)
    setModalOpen(true)
  }

  function openEditTransaction(transaction) {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  function closeTransactionModal() {
    if (saving) return
    setModalOpen(false)
    setEditingTransaction(null)
  }

  async function addTransaction(values) {
    setSaving(true)
    try {
      const data = await apiRequest('/transactions', {
        method: 'POST',
        token: session.token,
        body: { ...values, note: values.note || null },
      })
      setTransactions((current) => [data.transaction, ...current])
      setModalOpen(false)
      setEditingTransaction(null)
      showToast('Transaksi berhasil disimpan.')
    } catch (error) {
      if (error.status === 401) clearSession()
      showToast(`Gagal menyimpan: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function updateTransaction(values) {
    setSaving(true)
    try {
      const data = await apiRequest('/transactions', {
        method: 'PATCH',
        token: session.token,
        body: { id: editingTransaction.id, ...values, note: values.note || null },
      })
      setTransactions((current) => current.map((item) => item.id === data.transaction.id ? data.transaction : item))
      setModalOpen(false)
      setEditingTransaction(null)
      showToast('Transaksi berhasil diperbarui.')
    } catch (error) {
      if (error.status === 401) clearSession()
      showToast(`Gagal memperbarui: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTransaction(transaction) {
    if (!window.confirm(`Hapus transaksi “${transaction.note || transaction.category}”?`)) return
    try {
      await apiRequest('/transactions', {
        method: 'DELETE',
        token: session.token,
        body: { id: transaction.id },
      })
    } catch (error) {
      if (error.status === 401) clearSession()
      showToast(`Gagal menghapus: ${error.message}`)
      return
    }
    setTransactions((current) => current.filter((item) => item.id !== transaction.id))
    showToast('Transaksi dihapus.')
  }

  async function deleteAllTransactions() {
    if (!transactions.length) {
      setDeleteAllOpen(false)
      return
    }

    setDeletingAll(true)
    try {
      await apiRequest('/transactions', {
        method: 'DELETE',
        token: session.token,
        body: { all: true },
      })
    } catch (error) {
      if (error.status === 401) clearSession()
      showToast(`Gagal menghapus semua transaksi: ${error.message}`)
      setDeletingAll(false)
      return
    }

    setTransactions([])
    setDeletingAll(false)
    setDeleteAllOpen(false)
    showToast('Semua transaksi berhasil dihapus.')
  }

  if (!isSupabaseConfigured) return <DatabaseConfigurationRequired />
  if (!authReady) return <div className="app-loader"><Logo /><span /></div>
  if (!session) return <AuthScreen onAuthenticated={setAuthenticatedSession} />

  const accountName = session.user.name || 'Akun Dompetku'

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} userName={accountName} onSignOut={signOut} />
      <MobileHeader page={page} setPage={setPage} onAdd={openAddTransaction} onSignOut={signOut} />
      <div className="app-main">
        <Topbar onAdd={openAddTransaction} />
        <main className="page-content">
          {loadingData ? <div className="content-loader"><span /> Memuat catatan keuangan…</div> : page === 'dashboard'
            ? <Dashboard transactions={transactions} onEdit={openEditTransaction} onDelete={deleteTransaction} onAdd={openAddTransaction} goToTransactions={() => setPage('transactions')} />
            : <TransactionsPage transactions={transactions} onEdit={openEditTransaction} onDelete={deleteTransaction} onDeleteAll={() => setDeleteAllOpen(true)} onAdd={openAddTransaction} />}
        </main>
      </div>
      {modalOpen && <TransactionModal transaction={editingTransaction} onClose={closeTransactionModal} onSave={editingTransaction ? updateTransaction : addTransaction} saving={saving} />}
      {deleteAllOpen && <DeleteAllModal count={transactions.length} onClose={() => setDeleteAllOpen(false)} onConfirm={deleteAllTransactions} deleting={deletingAll} />}
      {toast && <div className="toast" role="status"><span />{toast}</div>}
    </div>
  )
}

export default App
