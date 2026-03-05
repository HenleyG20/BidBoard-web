import React, { useMemo, useState } from 'react'

type Trade = 'Concrete' | 'HVAC' | 'Painting' | 'Plumbing' | 'Electric' | 'Flooring' | 'Construction'
type ProjectStatus = 'Bidding' | 'Awarding' | 'Awarded'
type FeeBasis = 'awarded' | 'forecast'

type Project = {
  id: string
  address: string
  status: ProjectStatus
  feePercent: number // e.g., 0.05
  feeBasis: FeeBasis
}

type Vendor = { id: string; name: string; trade: Trade; email?: string; phone?: string }

type Estimate = {
  id: string
  projectId: string
  trade: Trade
  vendorId: string
  quoteNo?: string
  amount: number
  date?: string
  notes?: string
}

type Award = {
  id: string
  projectId: string
  trade: Trade
  vendorId: string
  amount: number
  startDate?: string
  endDate?: string
  notes?: string
}

type TradeSchedule = {
  projectId: string
  trade: Trade
  startDate?: string
  endDate?: string
  status: 'Not started' | 'Scheduled' | 'In progress' | 'Complete'
}

const uid = () => Math.random().toString(36).slice(2, 10)

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const TRADES: Trade[] = ['Concrete', 'HVAC', 'Painting', 'Plumbing', 'Electric', 'Flooring', 'Construction']

const seedProject: Project = {
  id: 'P-124',
  address: '124 N Broad',
  status: 'Awarding',
  feePercent: 0.05,
  feeBasis: 'awarded',
}

const seedVendors: Vendor[] = [
  { id: 'V1', name: 'Williams Concrete', trade: 'Concrete' },
  { id: 'V2', name: 'Schwickerts', trade: 'HVAC' },
  { id: 'V3', name: 'Weichmann', trade: 'Painting' },
  { id: 'V4', name: 'MRI', trade: 'Plumbing' },
  { id: 'V5', name: 'BC Electric', trade: 'Electric' },
  { id: 'V6', name: 'KBM', trade: 'Flooring' },
  { id: 'V7', name: '7-Systems', trade: 'Construction' },
  { id: 'V8', name: 'Hunt Plumbing', trade: 'Plumbing' },
]

const seedEstimates: Estimate[] = [
  { id: uid(), projectId: seedProject.id, trade: 'Concrete', vendorId: 'V1', amount: 1800, quoteNo: '—', date: '2026-03-01' },

  { id: uid(), projectId: seedProject.id, trade: 'HVAC', vendorId: 'V2', amount: 3285, quoteNo: '—', date: '2026-03-01' },

  { id: uid(), projectId: seedProject.id, trade: 'Painting', vendorId: 'V3', amount: 3980, quoteNo: '—', date: '2026-03-01' },

  { id: uid(), projectId: seedProject.id, trade: 'Plumbing', vendorId: 'V4', amount: 4345, quoteNo: '206', date: '2026-03-01' },
  { id: uid(), projectId: seedProject.id, trade: 'Plumbing', vendorId: 'V8', amount: 5000, quoteNo: '—', date: '2026-03-02' },

  { id: uid(), projectId: seedProject.id, trade: 'Electric', vendorId: 'V5', amount: 8480, quoteNo: '—', date: '2026-03-02' },

  { id: uid(), projectId: seedProject.id, trade: 'Flooring', vendorId: 'V6', amount: 14275, quoteNo: '—', date: '2026-03-02' },

  { id: uid(), projectId: seedProject.id, trade: 'Construction', vendorId: 'V7', amount: 47577, quoteNo: '—', date: '2026-03-03' },
]

const seedSchedules: TradeSchedule[] = TRADES.map((t) => ({
  projectId: seedProject.id,
  trade: t,
  status: 'Not started',
}))

type Tab = 'Compare' | 'Estimates' | 'Awards' | 'Vendors' | 'Settings'

export default function App() {
  const [project, setProject] = useState<Project>(seedProject)
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors)
  const [estimates, setEstimates] = useState<Estimate[]>(seedEstimates)
  const [awards, setAwards] = useState<Award[]>([])
  const [schedules, setSchedules] = useState<TradeSchedule[]>(seedSchedules)
  const [tab, setTab] = useState<Tab>('Compare')

  const vendorById = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors])

  const estimatesByTrade = useMemo(() => {
    const map = new Map<Trade, Estimate[]>()
    for (const t of TRADES) map.set(t, [])
    for (const e of estimates.filter((x) => x.projectId === project.id)) {
      map.get(e.trade)!.push(e)
    }
    for (const t of TRADES) map.get(t)!.sort((a, b) => a.amount - b.amount)
    return map
  }, [estimates, project.id])

  const awardByTrade = useMemo(() => {
    const map = new Map<Trade, Award>()
    for (const a of awards.filter((x) => x.projectId === project.id)) map.set(a.trade, a)
    return map
  }, [awards, project.id])

  const scheduleByTrade = useMemo(() => {
    const map = new Map<Trade, TradeSchedule>()
    for (const s of schedules.filter((x) => x.projectId === project.id)) map.set(s.trade, s)
    return map
  }, [schedules, project.id])

  const awardedBaseCost = useMemo(() => {
    let sum = 0
    for (const a of awards.filter((x) => x.projectId === project.id)) sum += a.amount
    return sum
  }, [awards, project.id])

  const forecastBaseCost = useMemo(() => {
    let sum = 0
    for (const t of TRADES) {
      const a = awardByTrade.get(t)
      if (a) sum += a.amount
      else {
        const list = estimatesByTrade.get(t) || []
        if (list.length) sum += list[0].amount
      }
    }
    return sum
  }, [awardByTrade, estimatesByTrade])

  const baseCost = project.feeBasis === 'awarded' ? awardedBaseCost : forecastBaseCost
  const feeAmount = baseCost * project.feePercent
  const totalWithFee = baseCost + feeAmount

  const addEstimate = (partial: Omit<Estimate, 'id' | 'projectId'>) => {
    setEstimates((prev) => [{ id: uid(), projectId: project.id, ...partial }, ...prev])
  }

  const upsertAward = (trade: Trade, vendorId: string, amount: number) => {
    setAwards((prev) => {
      const existing = prev.find((x) => x.projectId === project.id && x.trade === trade)
      if (!existing) return [{ id: uid(), projectId: project.id, trade, vendorId, amount }, ...prev]
      return prev.map((x) => (x.id === existing.id ? { ...x, vendorId, amount } : x))
    })
  }

  const removeAward = (trade: Trade) => {
    setAwards((prev) => prev.filter((x) => !(x.projectId === project.id && x.trade === trade)))
  }

  const updateSchedule = (trade: Trade, patch: Partial<TradeSchedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.projectId === project.id && s.trade === trade ? { ...s, ...patch } : s)),
    )
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <div>
          <h1>BidBoard</h1>
          <small>
            Project <span className="pill mono">{project.id}</span> • {project.address} •{' '}
            <span className="pill">{project.status}</span>
          </small>
        </div>
        <div className="row" style={{ alignItems: 'stretch' }}>
          <div className="card" style={{ minWidth: 320 }}>
            <div className="kpi">
              <div>
                <small>Base Cost ({project.feeBasis === 'awarded' ? 'Awarded' : 'Forecast'})</small>
                <div className="value mono">{money(baseCost)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small>Fee ({Math.round(project.feePercent * 100)}%)</small>
                <div className="value mono">{money(feeAmount)}</div>
              </div>
            </div>
            <hr />
            <div className="flex-between">
              <div>
                <small>Total w/ Fee</small>
                <div className="value mono">{money(totalWithFee)}</div>
              </div>
              <div style={{ width: 160 }}>
                <select
                  value={project.feeBasis}
                  onChange={(e) => setProject((p) => ({ ...p, feeBasis: e.target.value as FeeBasis }))}
                  aria-label="Fee basis"
                >
                  <option value="awarded">Awarded</option>
                  <option value="forecast">Forecast</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        {(['Compare', 'Estimates', 'Awards', 'Vendors', 'Settings'] as Tab[]).map((t) => (
          <div key={t} style={{ flex: '0 0 140px' }}>
            <button className={tab === t ? 'primary' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          </div>
        ))}
      </div>

      {tab === 'Compare' && (
        <CompareView
          vendorById={vendorById}
          estimatesByTrade={estimatesByTrade}
          awardByTrade={awardByTrade}
          scheduleByTrade={scheduleByTrade}
          onUpsertAward={upsertAward}
          onRemoveAward={removeAward}
          onUpdateSchedule={updateSchedule}
        />
      )}

      {tab === 'Estimates' && (
        <EstimatesView
          vendors={vendors}
          vendorById={vendorById}
          estimates={estimates.filter((e) => e.projectId === project.id)}
          onAdd={addEstimate}
        />
      )}

      {tab === 'Awards' && (
        <AwardsView
          awards={awards.filter((a) => a.projectId === project.id)}
          vendorById={vendorById}
          scheduleByTrade={scheduleByTrade}
          onRemoveAward={removeAward}
        />
      )}

      {tab === 'Vendors' && <VendorsView vendors={vendors} setVendors={setVendors} />}

      {tab === 'Settings' && <SettingsView project={project} setProject={setProject} />}

      <div style={{ marginTop: 18 }}>
        <small>Prototype build: local-only data. Next step is adding login + database + Excel import.</small>
      </div>
    </div>
  )
}

function CompareView(props: {
  vendorById: Map<string, Vendor>
  estimatesByTrade: Map<Trade, Estimate[]>
  awardByTrade: Map<Trade, Award>
  scheduleByTrade: Map<Trade, TradeSchedule>
  onUpsertAward: (trade: Trade, vendorId: string, amount: number) => void
  onRemoveAward: (trade: Trade) => void
  onUpdateSchedule: (trade: Trade, patch: Partial<TradeSchedule>) => void
}) {
  const [openTrade, setOpenTrade] = useState<Trade | null>('Concrete')

  return (
    <div className="card">
      <h2>Compare bids by trade</h2>
      <small>See every estimate per trade, schedule dates, and award winners.</small>

      <div style={{ marginTop: 12 }}>
        {TRADES.map((trade) => {
          const list = props.estimatesByTrade.get(trade) || []
          const award = props.awardByTrade.get(trade)
          const sched = props.scheduleByTrade.get(trade)

          const min = list.length ? list[0].amount : undefined
          const max = list.length ? list[list.length - 1].amount : undefined
          const spread = min != null && max != null ? max - min : undefined

          const isOpen = openTrade === trade
          return (
            <div key={trade} style={{ marginBottom: 10 }}>
              <button onClick={() => setOpenTrade(isOpen ? null : trade)} className={isOpen ? 'primary' : ''}>
                <div className="flex-between" style={{ width: '100%' }}>
                  <div className="flex" style={{ gap: 12 }}>
                    <strong>{trade}</strong>
                    <span className="pill">{list.length} bids</span>
                    {award && (
                      <span className="pill">Awarded: {props.vendorById.get(award.vendorId)?.name ?? '—'}</span>
                    )}
                  </div>
                  <div className="flex" style={{ gap: 12 }}>
                    <span className="mono">{min != null ? `Low ${money(min)}` : 'No bids yet'}</span>
                    <span className="mono" style={{ opacity: 0.75 }}>
                      {spread != null ? `Spread ${money(spread)}` : ''}
                    </span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="card" style={{ marginTop: 10 }}>
                  <div className="row">
                    <div className="col">
                      <h3>Estimates</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Vendor</th>
                            <th>Total</th>
                            <th>Quote #</th>
                            <th>Date</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((e) => (
                            <tr key={e.id}>
                              <td>{props.vendorById.get(e.vendorId)?.name ?? '—'}</td>
                              <td className="mono">{money(e.amount)}</td>
                              <td className="mono">{e.quoteNo ?? ''}</td>
                              <td className="mono">{e.date ?? ''}</td>
                              <td>{e.notes ?? ''}</td>
                            </tr>
                          ))}
                          {!list.length && (
                            <tr>
                              <td colSpan={5}><small>No estimates for this trade yet.</small></td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div style={{ marginTop: 10 }} className="row">
                        <div className="col">
                          <button
                            className="primary"
                            disabled={!list.length}
                            onClick={() => {
                              const winner = list[0]
                              props.onUpsertAward(trade, winner.vendorId, winner.amount)
                            }}
                          >
                            Award lowest bid
                          </button>
                        </div>
                        <div className="col">
                          <button className="danger" disabled={!award} onClick={() => props.onRemoveAward(trade)}>
                            Undo award
                          </button>
                        </div>
                      </div>

                      {award && (
                        <div style={{ marginTop: 10 }}>
                          <small>
                            Awarded to <strong>{props.vendorById.get(award.vendorId)?.name ?? '—'}</strong> for{' '}
                            <span className="mono">{money(award.amount)}</span>.
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="col">
                      <h3>Trade schedule</h3>
                      <div className="row">
                        <div className="col">
                          <small>Start date</small>
                          <input
                            type="date"
                            value={sched?.startDate ?? ''}
                            onChange={(e) => props.onUpdateSchedule(trade, { startDate: e.target.value })}
                          />
                        </div>
                        <div className="col">
                          <small>End date</small>
                          <input
                            type="date"
                            value={sched?.endDate ?? ''}
                            onChange={(e) => props.onUpdateSchedule(trade, { endDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <small>Status</small>
                        <select
                          value={sched?.status ?? 'Not started'}
                          onChange={(e) => props.onUpdateSchedule(trade, { status: e.target.value as TradeSchedule['status'] })}
                        >
                          <option>Not started</option>
                          <option>Scheduled</option>
                          <option>In progress</option>
                          <option>Complete</option>
                        </select>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <small>Tip: use <strong>Forecast</strong> fee basis to estimate totals before all trades are awarded.</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EstimatesView(props: {
  vendors: Vendor[]
  vendorById: Map<string, Vendor>
  estimates: Estimate[]
  onAdd: (partial: Omit<Estimate, 'id' | 'projectId'>) => void
}) {
  const [trade, setTrade] = useState<Trade>('Plumbing')
  const [vendorId, setVendorId] = useState<string>(() => props.vendors.find((v) => v.trade === 'Plumbing')?.id ?? props.vendors[0]?.id ?? '')
  const [amount, setAmount] = useState<string>('0')
  const [quoteNo, setQuoteNo] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const tradeVendors = useMemo(() => props.vendors.filter((v) => v.trade === trade), [props.vendors, trade])

  React.useEffect(() => {
    if (!tradeVendors.some((v) => v.id === vendorId)) setVendorId(tradeVendors[0]?.id ?? props.vendors[0]?.id ?? '')
  }, [trade, tradeVendors, vendorId, props.vendors])

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2>Add estimate</h2>
          <div className="row">
            <div className="col">
              <small>Trade</small>
              <select value={trade} onChange={(e) => setTrade(e.target.value as Trade)}>
                {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col">
              <small>Vendor</small>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                {tradeVendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                {!tradeVendors.length && <option value="">No vendors for trade</option>}
              </select>
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="col">
              <small>Total</small>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </div>
            <div className="col">
              <small>Quote #</small>
              <input value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} />
            </div>
            <div className="col">
              <small>Date</small>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <small>Notes</small>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              className="primary"
              onClick={() => {
                const n = Number(amount)
                if (!Number.isFinite(n) || n <= 0 || !vendorId) return
                props.onAdd({ trade, vendorId, amount: n, quoteNo: quoteNo || undefined, date: date || undefined, notes: notes || undefined })
                setAmount('0'); setQuoteNo(''); setDate(''); setNotes('')
              }}
            >
              Add estimate
            </button>
          </div>
        </div>
      </div>

      <div className="col" style={{ flex: '1 1 600px' }}>
        <div className="card">
          <h2>All estimates</h2>
          <table>
            <thead>
              <tr>
                <th>Trade</th><th>Vendor</th><th>Total</th><th>Quote #</th><th>Date</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {props.estimates
                .slice()
                .sort((a, b) => (a.trade === b.trade ? a.amount - b.amount : a.trade.localeCompare(b.trade)))
                .map((e) => (
                  <tr key={e.id}>
                    <td>{e.trade}</td>
                    <td>{props.vendorById.get(e.vendorId)?.name ?? '—'}</td>
                    <td className="mono">{money(e.amount)}</td>
                    <td className="mono">{e.quoteNo ?? ''}</td>
                    <td className="mono">{e.date ?? ''}</td>
                    <td>{e.notes ?? ''}</td>
                  </tr>
                ))}
              {!props.estimates.length && <tr><td colSpan={6}><small>No estimates yet.</small></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AwardsView(props: {
  awards: Award[]
  vendorById: Map<string, Vendor>
  scheduleByTrade: Map<Trade, TradeSchedule>
  onRemoveAward: (trade: Trade) => void
}) {
  const rows = props.awards.slice().sort((a, b) => a.trade.localeCompare(b.trade))
  return (
    <div className="card">
      <h2>Awards</h2>
      <small>All awarded trades for this project (with optional start/end dates).</small>
      <div style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr><th>Trade</th><th>Vendor</th><th>Award</th><th>Start</th><th>End</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const sched = props.scheduleByTrade.get(a.trade)
              return (
                <tr key={a.id}>
                  <td>{a.trade}</td>
                  <td>{props.vendorById.get(a.vendorId)?.name ?? '—'}</td>
                  <td className="mono">{money(a.amount)}</td>
                  <td className="mono">{sched?.startDate ?? ''}</td>
                  <td className="mono">{sched?.endDate ?? ''}</td>
                  <td style={{ width: 140 }}><button className="danger" onClick={() => props.onRemoveAward(a.trade)}>Undo</button></td>
                </tr>
              )
            })}
            {!rows.length && <tr><td colSpan={6}><small>No awards yet. Go to Compare → “Award lowest bid”.</small></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VendorsView(props: { vendors: Vendor[]; setVendors: React.Dispatch<React.SetStateAction<Vendor[]>> }) {
  const [name, setName] = useState('')
  const [trade, setTrade] = useState<Trade>('Plumbing')
  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2>Add vendor</h2>
          <small>Keep vendors tagged by trade for cleaner bid entry.</small>
          <div style={{ marginTop: 10 }}>
            <small>Name</small>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <small>Trade</small>
            <select value={trade} onChange={(e) => setTrade(e.target.value as Trade)}>
              {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              className="primary"
              onClick={() => {
                if (!name.trim()) return
                props.setVendors((prev) => [{ id: uid(), name: name.trim(), trade }, ...prev])
                setName('')
              }}
            >
              Add vendor
            </button>
          </div>
        </div>
      </div>

      <div className="col" style={{ flex: '1 1 600px' }}>
        <div className="card">
          <h2>Vendors</h2>
          <table>
            <thead><tr><th>Vendor</th><th>Trade</th></tr></thead>
            <tbody>
              {props.vendors
                .slice()
                .sort((a, b) => (a.trade === b.trade ? a.name.localeCompare(b.name) : a.trade.localeCompare(b.trade)))
                .map((v) => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td>{v.trade}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SettingsView(props: { project: Project; setProject: React.Dispatch<React.SetStateAction<Project>> }) {
  return (
    <div className="card">
      <h2>Settings</h2>
      <div className="row" style={{ marginTop: 10 }}>
        <div className="col">
          <small>Fee %</small>
          <input
            value={String(Math.round(props.project.feePercent * 100))}
            onChange={(e) => {
              const pct = Number(e.target.value)
              if (!Number.isFinite(pct)) return
              props.setProject((p) => ({ ...p, feePercent: Math.max(0, pct) / 100 }))
            }}
            inputMode="numeric"
          />
        </div>
        <div className="col">
          <small>Project status</small>
          <select value={props.project.status} onChange={(e) => props.setProject((p) => ({ ...p, status: e.target.value as ProjectStatus }))}>
            <option>Bidding</option><option>Awarding</option><option>Awarded</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <small>Fee is calculated on the <strong>project total</strong> (Awarded or Forecast), not per trade.</small>
      </div>
    </div>
  )
}
