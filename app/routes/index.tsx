import { Outlet } from '@remix-run/react'
import { useEffect, useState, useRef } from "react"
import { useQuery, useMutation, QueryClient, QueryClientProvider, QueryObserver } from 'react-query'

import { classNames } from 'primereact/utils'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Menubar } from 'primereact/menubar';
import { TabView, TabPanel } from 'primereact/tabview'
import { OverlayPanel } from 'primereact/overlaypanel'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'

import theme from "primereact/resources/themes/lara-dark-indigo/theme.css"  //theme
import pr from "primereact/resources/primereact.min.css"                  //core css
import pf from 'primeflex/primeflex.css';
import icons from "primeicons/primeicons.css"                                //icons
import overrides from "../styles/overrides.css"                              //overrides

import chroma from 'chroma-js'

import OrderForm from '~/components/order-form'
import { FormattedDate } from '~/components/date'
import currencyFormat from '~/utils/currency-format'
import { ExpandedLotRow } from '~/components/expanded-lot-row'

const queryClient = new QueryClient()

const stopScale = chroma.scale(['#ffcc00', '#ffffff']).domain([0, 20])

export function links() {
  return [
    { rel: "stylesheet", href: pr },
    { rel: "stylesheet", href: pf },
    { rel: "stylesheet", href: theme },
    { rel: "stylesheet", href: icons },
    { rel: "stylesheet", href: overrides },
  ]
}

interface SalientRowProps {
  sym: string,
  qty?: number,
  filled_avg_price?: number,
  limit_price?: number,
  stop_price?: number,
  cost_basis?: number,
  broker_status?: string,
  status?: string,
  dispose_reason?: string,
  disposed_fill_price?: number,
  time_in_force?: string,
  target_price?: number,
  position_type?: string,
}

const useLastTradeQuery = ({ sym }: SalientRowProps) => {
  return useQuery(
    ['latest', sym],
    async () => {
      const response = await fetch(`http://localhost:3001/latest?sym=${sym}`)
      if (!response.ok) {
        console.log('Network error', response.status)
        throw new Error('Network error')
      }
      return response.json()
    },
    {
      refetchInterval: 1000 * 60 * 15, // 15 minutes
      refetchIntervalInBackground: true
    }
  )
}

const LastTrade = ({ sym }: SalientRowProps) => {
  const { isLoading, isError, data, error } = useLastTradeQuery({ sym })
  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  return (
    <div className="latest-trade">
      {currencyFormat(data[0].price)}
    </div>
  )
}

const GainLossDisposed = ({ sym, qty, cost_basis, disposed_fill_price }: SalientRowProps) => {
  if (!qty || !cost_basis || !disposed_fill_price) return <p>...</p>

  const gL = (qty * disposed_fill_price) - (cost_basis * 1.0)
  const pct = (gL / cost_basis) * 100

  return (
    <div className={classNames("gain-loss", { gain: gL > 0, loss: gL < 0 })}>
      {currencyFormat(gL)} ({pct.toFixed(2)}%)
    </div>
  )
}

const GainLoss = ({ qty, cost_basis, sym, status }: SalientRowProps) => {
  const [gL, setGL] = useState(0)
  const [pct, setPct] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const observer = new QueryObserver(queryClient, { queryKey: ['latest', sym] })
    const unsubscribe = observer.subscribe(( { data }) => {
      if (cost_basis && qty && data instanceof Array) {
        const gain = (data[0].price * qty) - cost_basis
        setGL(gain)
        setPct((gain / cost_basis) * 100)
        setLoading(false)
      }
    })
    return unsubscribe
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const unrealized = (status == 'Open' || status == 'Pending')

  return (
    <div className={classNames("gain-loss", { gain: gL > 0, loss: gL < 0, unrealized })}>
      {loading ? '...' : currencyFormat(gL)}
      {loading ? '': ` (${pct.toFixed(2)}%)`}
    </div>
  )
}

const StopCell = ({ status, sym, stop_price, filled_avg_price, relative } : SalientRowProps & { relative: boolean }) => {
  // TODO does not respect cache?
  const { isLoading, isError, data } = useLastTradeQuery({ sym })

  if (!stop_price || status == 'Canceled') return <></>

  if (filled_avg_price) {
    let elev = (isLoading || isError) ? 0 : ((data[0].price - stop_price)/stop_price * 100)
    const scaleStyle = (status == 'Disposed') ? {} : {color: stopScale(elev).css()}

    if (relative) {
      let stopDiff = ((1 - (stop_price / filled_avg_price)) * 100).toFixed(2)
      return <div style={scaleStyle}>{stopDiff}% ({elev.toFixed(2)}%)</div>
    } else {
      let stopDiff = (isLoading || isError) ? '...' : currencyFormat(data[0].price - stop_price)
      return <div style={scaleStyle}>{currencyFormat(stop_price)} ({stopDiff})</div>
    }
  }
  else {
    return <div>{currencyFormat(stop_price)}</div>
  }
}

// Show max loss absolute amount with scary red color if near 1000 (prob useless)
const MaxLossCell = ({ stop_price, limit_price, qty, cost_basis, status } : SalientRowProps) => {
  if (!stop_price || !limit_price || !qty || status == 'Canceled' || status == 'Disposed') return <></>
  if (!cost_basis) {
    cost_basis = qty * limit_price
  }
  if (stop_price > 0 && qty > 0) {
      let max = (stop_price * qty) - cost_basis
      let scale = 1000 // TODO make this a setting

      // brought to you by the fact that React will not insert backgoundColor into the style attribute
      // when it is in rgba[] format, but only when in full #rrggbbaa format
      let alpha = Math.round((255 * Math.min(1, Math.abs(max / scale)))).toString(16).padStart(2, '0')
      let rgba = `#993344${alpha}`
      return <div style={{backgroundColor: rgba}}>{currencyFormat(max)}</div>
  }
}

const PriceCell = ({ qty, sym, filled_avg_price, limit_price, position_type } : SalientRowProps) => {
  const color = position_type == 'Short' ? 'red' : 'inherit'
  const pos = position_type == 'Short' ? (qty || 0) * -1 : qty

  let price = currencyFormat(filled_avg_price || limit_price) || 'market'

  if (price) {
    return <div><span style={{color}}>{pos}</span> <strong>{sym}</strong>@{price}</div>
  }
  else {
    return <></>
  }
}

const RiskLevelCell = ({ qty, stop_price, filled_avg_price, limit_price, target_price } : SalientRowProps) => {
  if (!stop_price || !limit_price || !qty) return <></>
  const entry_price = filled_avg_price || limit_price

  const reward = Math.abs(target_price - entry_price)
  const risk = Math.abs(entry_price - stop_price)
  const rr = reward / risk

  return <div>{rr.toFixed(1)}</div>
}

const StatusCell = ({ status, broker_status, time_in_force, dispose_reason } : SalientRowProps) => {
  if (status == 'Disposed') {
    return <div className="status">{dispose_reason}</div>
  } else if (status == 'Pending') {
    return <div className="status">{status} / {broker_status} ({time_in_force})</div>
  } else {
    return <div className="status">{status}</div>
  }
}

const StopHeader = ({ toggle, relative } : {relative: boolean, toggle: Function}) => {
  return <div className="actionHeader" onClick={() => toggle()}>
    {relative ? "Stop (%)" : "Stop ($)"}
  </div>
}

const PositionsTable = ({bucket}: { bucket: string }) => {
  const [selectedRow, setSelectedRow] = useState(null)
  const [relativeStop, setRelativeStop] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})

  const rowClass = (data: any) => {
    return {
      'row-pending': data.status === 'Pending',
      'row-open': data.status === 'Open',
      'row-disposed': data.status === 'Disposed',
      'row-other': data.status === 'Other',
    }
  }

  const { isLoading, isError, data, error } = useQuery('positions', async () => {
    const response = await fetch(`http://localhost:3001/orders?bucket_id=${bucket}`)
    if (!response.ok) {
      console.log('Network error', response.status)
      throw new Error('Network error')
    }
    return response.json()
  }, {
    refetchOnWindowFocus: false,
    refetchInterval: 3600000,
    cacheTime: 3600000,
  })
  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  const allowExpansion = data.length > 0

  return (
    <DataTable
      value={data}
      size="small"
      metaKeySelection={false}
      showGridlines
      rowClassName={rowClass}
      responsiveLayout="scroll"
      selection={selectedRow}
      onSelectionChange={e => setSelectedRow(e.value)}
      selectionMode="single"
      dataKey="rowid"
      expandedRows={expandedRows}
      onRowToggle={(e) => setExpandedRows(e.data)}
      rowExpansionTemplate={ExpandedLotRow}
      >
      <Column expander={allowExpansion} style={{ width: '3em' }} />
      <Column field="status" header="Status" body={StatusCell}></Column>
      <Column field="created_at" header="Entered" body={(row) => <FormattedDate isoString={row.created_at} />}></Column>
      <Column field="price" header="Entry" body={PriceCell}></Column>
      <Column field="cost_basis" header="Cost Basis" body={(row) => currencyFormat(row.cost_basis)} />
      <Column
        field="stop"
        header={<StopHeader relative={relativeStop} toggle={() => setRelativeStop(!relativeStop)} />}
        body={(row) => <StopCell status={row.status} sym={row.sym} stop_price={row.stop_price} filled_avg_price={row.filled_avg_price} relative={relativeStop} />}
       />
      <Column field="max_loss" header="Max Loss" body={MaxLossCell} />
      <Column field="target_price" header="Target" body={(row) => currencyFormat(row.target_price)} />
      <Column field="risk_level" header="R/R" body={RiskLevelCell} />
      <Column field="last_trade" header="Last" body={(row) => <LastTrade sym={row.sym} />}></Column>
      <Column
        field="gainloss"
        header="G/L"
        body={(row) => row.status == 'Disposed' ? GainLossDisposed(row) : GainLoss(row)}
        />
    </DataTable>
  )
}

const NavBar = ({toggleOrderForm} : {toggleOrderForm : Function}) => {
  const menuItems = [
    {
      label:'Zincbee',
      icon:'pi pi-fw pi-file',
    }
  ]

  const orderFormSlider = <i onClick={(_e) => toggleOrderForm()} className="pi pi-angle-double-right" style={{'fontSize': '2em'}} />

  return (
    <Menubar model={menuItems} start={orderFormSlider} />
  )
}

const BucketView = ({ onChange }: { onChange : Function} ) => {
  const [bucketIndex, setBucketIndex] = useState(0)
  const [newBucketName, setNewBucketName] = useState("")
  const op = useRef<OverlayPanel>(null)
  const errorToast = useRef<Toast>(null)
  const inputRef = useRef<any>(null)

  const { isLoading, isError, error, refetch, data: buckets } = useQuery('buckets', async () => {
    const response = await fetch('http://localhost:3001/buckets')
    if (!response.ok) {
      throw new Error('Network error')
    }
    return response.json()
  }, {
    refetchOnWindowFocus: false,
    refetchInterval: Infinity,
    cacheTime: Infinity,
    onSuccess: (data) => {
      onChange(data[bucketIndex].rowid)
    }
  })

  const { mutate: postBucket } = useMutation({
    mutationFn: async (newBucketName: string) => {
      const response = await fetch(`http://localhost:3001/bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: newBucketName})
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText} - ${result.error}`)
      }
      return result
    },
    onSuccess: () => { op.current?.hide(); refetch() },
  })

  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  const chooseBucket = (i: number) => {
    setBucketIndex(i)
    onChange(buckets[i].rowid)
  }

  const addBucketButton = (_options: any) => {
    return  (
      <div className="flex align-items-center px-3 pi pi-plus" style={{ cursor: 'pointer' }} onClick={(e) => op.current?.toggle(e)} />
    )
  }

  const saveBucket = (e: any) => {
    if (e.key === 'Enter') {
      postBucket(newBucketName, { onError: (e: any) => {
        errorToast.current?.show({severity: 'error', summary: 'Error', detail: e.message, life: 3000})
      }})
    }
  }

  return (
    <>
    <Toast ref={errorToast} position="top-right" />
    <TabView activeIndex={bucketIndex} onTabChange={(e) => chooseBucket(e.index)} scrollable className="bucketTabs">
      {buckets.map((bucket: { rowid: string, name: string }) => {
        return (
          <TabPanel header={bucket.name} key={bucket.rowid} leftIcon="pi pi-fw pi-home">
            <PositionsTable bucket={bucket.rowid} />
          </TabPanel>
        )
      })}
      <TabPanel headerTemplate={addBucketButton} headerClassName="flex align-items-center" />
    </TabView>
    <OverlayPanel ref={op} dismissable style={{width: '300px'}} onShow={() => inputRef.current?.focus({preventScroll: true})} >
      <InputText type="text" className="p-inputtext-sm block mb-2" ref={inputRef} onKeyUp={saveBucket} onChange={(e) => setNewBucketName(e.target.value)} />
    </OverlayPanel>
    </>
  )
}


export default function Index() {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [bucketId, setBucketId] = useState(null)

  const toggleOrderForm = () => {
    setShowOrderForm(!showOrderForm)
  }

  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <QueryClientProvider client={queryClient}>
        <NavBar toggleOrderForm={toggleOrderForm} />
        <OrderForm visible={showOrderForm} setVisible={setShowOrderForm} bucketId={bucketId} />
        <BucketView onChange={setBucketId}  />
      </QueryClientProvider>
    </div>
    <Outlet />
    </>
  )
}
