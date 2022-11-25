import { Outlet } from '@remix-run/react'
import { useEffect, useState } from "react"
import { classNames } from 'primereact/utils'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useQuery, QueryClient, QueryClientProvider, QueryObserver } from 'react-query'

import theme from "primereact/resources/themes/lara-dark-indigo/theme.css"  //theme
import pr from "primereact/resources/primereact.min.css"                  //core css
import pf from 'primeflex/primeflex.css';
import icons from "primeicons/primeicons.css"                                //icons

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
  ]
}

interface SalientRowProps {
  symbol: string,
  costBasis?: number,
  qty?: number,
  filled_avg_price?: number,
  stop?: number,
  orderId?: string,
  limit_price?: number,
  stop_price?: number,
  cost_basis?: number,
  broker_status?: string,
}

const useLastTradeQuery = ({ symbol }: SalientRowProps) => {
  return useQuery(
    ['latest', symbol],
    async () => {
      console.log('fetching latest quote for ', symbol)
      const response = await fetch(`http://localhost:3001/latest?sym=${symbol}`)
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

const LastTrade = ({ symbol }: SalientRowProps) => {
  const { isLoading, isError, data, error } = useLastTradeQuery({ symbol })
  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  return (
    <div className="latest-trade">
      {currencyFormat(data[0].price)}
    </div>
  )
}

const GainLoss = ({ qty, costBasis, symbol }: SalientRowProps) => {
  const [gL, setGL] = useState(0)
  const [pct, setPct] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const observer = new QueryObserver(queryClient, { queryKey: ['latest', symbol] })
    const unsubscribe = observer.subscribe(( { data }) => {
      if (costBasis && qty && data instanceof Array) {
        const gain = (data[0].price * qty) - costBasis
        setGL(gain)
        setPct((gain / costBasis) * 100)
        // console.log(symbol, qty, gain, costBasis)
        setLoading(false)
      }
    })
    return unsubscribe
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={classNames("gain-loss", { gain: gL > 0, loss: gL < 0})}>
      {loading ? '...' : currencyFormat(gL)}
      {loading ? '': ` (${pct.toFixed(2)}%)`}
    </div>
  )
}

const StopCell = ({ symbol, stop, filled_avg_price, relative } : SalientRowProps & { relative: boolean }) => {
  // TODO does not respect cache?
  const { isLoading, isError, data } = useLastTradeQuery({ symbol })

  if (!stop) return <></>

  if (filled_avg_price) {
    let elev = (isLoading || isError) ? 0 : ((data[0].price - stop)/stop * 100)

    if (relative) {
      let stopDiff = ((1 - (stop / filled_avg_price)) * 100).toFixed(2)
      return <div style={{color: stopScale(elev).css()}}>{stopDiff}% ({elev.toFixed(2)}%)</div>
    } else {
      let stopDiff = (isLoading || isError) ? '...' : currencyFormat(data[0].price - stop)
      return <div style={{color: stopScale(elev).css()}}>{currencyFormat(stop)} ({stopDiff})</div>
    }
  }
  else {
    return <div>{currencyFormat(stop)}</div>
  }
}

// Show max loss absolute amount with scary red color if near 1000 (prob useless)
const MaxLossCell = ({ stop_price, limit_price, qty, cost_basis } : SalientRowProps) => {
  if (!stop_price || !limit_price || !qty) return <></>
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

const PriceCell = ({ filled_avg_price, limit_price } : { filled_avg_price: number, limit_price: number }) => {
  if (filled_avg_price) {
    return <div>{currencyFormat(filled_avg_price)}</div>
  }
  else if (limit_price) {
    return <div><em>{currencyFormat(limit_price)}</em></div>
  }
  else {
    return <></>
  }
}

const StatusCell = ({ status, broker_status, time_in_force } : { status: string, broker_status: string, time_in_force: string }) => {
  return <div>{status} / {broker_status} ({time_in_force})</div>
}

const StopHeader = ({ toggle, relative } : {relative: boolean, toggle: Function}) => {
  return <div className="actionHeader" onClick={() => toggle()}>
    {relative ? "Stop (%)" : "Stop ($)"}
  </div>
}

const PositionsTable = () => {
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
    const response = await fetch(`http://localhost:3001/orders?start`)
    if (!response.ok) {
      console.log('Network error', response.status)
      throw new Error('Network error')
    }
    return response.json()
  }, {
    refetchOnWindowFocus: false
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
      <Column field="status" header="Status" body={(row) => <StatusCell time_in_force={row.time_in_force} status={row.status} broker_status={row.broker_status} />}></Column>
      <Column field="sym" header="Symbol"></Column>
      <Column field="created_at" header="Entered" body={(row) => <FormattedDate isoString={row.created_at} />}></Column>
      <Column field="qty" header="Quantity"></Column>
      <Column field="price" header="Price" body={(row) => <PriceCell filled_avg_price={row.filled_avg_price} limit_price={row.limit_price} />} />
      <Column field="cost_basis" header="Cost Basis" body={(row) => currencyFormat(row.cost_basis)} />
      <Column
        field="stop"
        header={<StopHeader relative={relativeStop} toggle={() => setRelativeStop(!relativeStop)} />}
        body={(row) => <StopCell symbol={row.sym} stop={row.stop_price} filled_avg_price={row.filled_avg_price} relative={relativeStop} />}
       />
      <Column field="max_loss" header="Max Loss" body={MaxLossCell} />
      <Column field="last_trade" header="Last" body={(row) => <LastTrade symbol={row.sym} />}></Column>
      <Column field="target_price" header="Target" body={(row) => currencyFormat(row.target_price)} />
      <Column
        field="gainloss"
        header="G/L"
        body={(row) => <GainLoss qty={row.qty} symbol={row.sym} costBasis={row.cost_basis} />}
        />
    </DataTable>
  )
}

export default function Index() {
  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <QueryClientProvider client={queryClient}>
        <OrderForm />
        <PositionsTable />
      </QueryClientProvider>
    </div>
    <Outlet />
    </>
  )
}
