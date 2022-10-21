import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useState } from "react"
import { FormattedDate } from '~/components/date'
import { classNames } from 'primereact/utils'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useQuery, QueryClient, QueryClientProvider, QueryObserver } from 'react-query'

import theme from "primereact/resources/themes/lara-dark-indigo/theme.css"  //theme
import pr from "primereact/resources/primereact.min.css"                  //core css
import icons from "primeicons/primeicons.css"                                //icons

const queryClient = new QueryClient()

export function links() {
  return [
    { rel: "stylesheet", href: pr },
    { rel: "stylesheet", href: theme },
    { rel: "stylesheet", href: icons },
  ]
}

interface CurrentQuoteProps {
  symbol: string,
  costBasis?: number,
  qty?: number,
}

const CurrentQuote = ({ symbol }: CurrentQuoteProps) => {
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
      {currencyFormat(data.ask_price)} / {currencyFormat(data.bid_price)}
    </div>
  )
}

const GainLoss = ({ qty, costBasis, symbol }: CurrentQuoteProps) => {
  const [gL, setGL] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const observer = new QueryObserver(queryClient, { queryKey: ['latest', symbol] })
    const unsubscribe = observer.subscribe(( { data }) => {
      console.log('result', data)
      if (costBasis && qty && data instanceof Object) {
        setGL((data.bid_price * qty) - costBasis)
        console.log(symbol, data.bid_price, qty, costBasis)
        setLoading(false)
      }
    })
    return unsubscribe
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="gain-loss">
      {loading ? '...' : currencyFormat(gL)}
    </div>
  )
}

const currencyFormat = (value: number | bigint | undefined) => {
  if (value) {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })
    return formatter.format(value)
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
      <Column field="current" header="Current" body={(row) => <CurrentQuote symbol={row.sym} />}></Column>
      <Column field="gainloss" header="G/L" body={(row) => <GainLoss qty={row.qty} symbol={row.sym} costBasis={row.cost_basis} />}></Column>
    </DataTable>
  )
}

export default function Index() {
  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <QueryClientProvider client={queryClient}>
        <h1>Positions</h1>
        <PositionsTable />
      </QueryClientProvider>
    </div>
    <Outlet />
    </>
  )
}
