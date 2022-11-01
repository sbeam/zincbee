import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useState } from "react"
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

interface LastTradeProps {
  symbol: string,
  costBasis?: number,
  qty?: number,
}

const LastTrade = ({ symbol }: LastTradeProps) => {
  // TODO this is really getting the latest quote, not the latest trade via apca. Need
  // to extend apca to get the latest trade
  const { isLoading, isError, data, error } = useQuery(
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
  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  return (
    <div className="latest-trade">
      {currencyFormat(data[0].price)}
    </div>
  )
}

const GainLoss = ({ qty, costBasis, symbol }: LastTradeProps) => {
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

const StopCell = ({ stop, filled_avg_price } : { stop: number, filled_avg_price: number }) => {
  if (stop > 0) {
    if (filled_avg_price > 0) {

      let elev = (1 - (stop / filled_avg_price)) * 100
      return <div style={{color: stopScale(elev).css()}}>{currencyFormat(stop)} ({elev.toFixed(2)}%)</div>
    }
    else {
      return <div>{currencyFormat(stop)}</div>
    }
  }
}

// Show max loss absolute amount with scary red color if near 1000 (prob useless)
const MaxLossCell = ({ stop, qty, cost_basis } : { stop: number, qty: number, cost_basis: number }) => {
  if (stop > 0 && qty > 0) {
      let max = (stop * qty) - cost_basis
      let scale = 1000 // TODO make this a setting

      // brought to you by the fact that React will not insert backgoundColor into the style attribute
      // when it is in rgba[] format, but only when in full #rrggbbaa format
      let alpha = Math.round((255 * Math.min(1, Math.abs(max / scale)))).toString(16).padStart(2, '0')
      let rgba = `#993344${alpha}`
      return <div style={{color: '#fff', backgroundColor: rgba}}>{currencyFormat(max)}</div>
  }
}

const PositionsTable = () => {
  const [selectedRow, setSelectedRow] = useState(null)

  const rowClass = (data: any) => {
    return {
      'row-accessories': data.category === 'Accessories'
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
      dataKey="id"
      >
      <Column field="sym" header="Symbol"></Column>
      <Column field="created_at" header="Entered" body={(row) => <FormattedDate isoString={row.created_at} />}></Column>
      <Column field="qty" header="Quantity"></Column>
      <Column field="filled_avg_price" header="Price" body={(row) => currencyFormat(row.filled_avg_price)} />
      <Column field="cost_basis" header="Cost Basis" body={(row) => currencyFormat(row.cost_basis)} />
      <Column field="stop" header="Stop (elevation%)" body={StopCell} />
      <Column field="max_loss" header="Max Loss" body={MaxLossCell} />
      <Column field="last_trade" header="Last" body={(row) => <LastTrade symbol={row.sym} />}></Column>
      <Column field="target" header="Target" body={(row) => currencyFormat(row.target)} />
      <Column field="gainloss" header="G/L" body={(row) => <GainLoss qty={row.qty} symbol={row.sym} costBasis={row.cost_basis} />}></Column>
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
