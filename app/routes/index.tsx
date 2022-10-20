import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useState } from "react"
import { FormattedDate } from '~/components/date'
import { classNames } from 'primereact/utils'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useQuery } from 'react-query'

import theme from "primereact/resources/themes/lara-dark-indigo/theme.css"  //theme
import pr from "primereact/resources/primereact.min.css"                  //core css
import icons from "primeicons/primeicons.css"                                //icons

export function links() {
  return [
    { rel: "stylesheet", href: pr },
    { rel: "stylesheet", href: theme },
    { rel: "stylesheet", href: icons },
  ]
}

async function loader({ start, end }: any) {
  const response = await fetch(`http://localhost:3001/orders?start=${start}&end=${end}`)
  const data = await response.json()
  return data
}

interface CurrentQuoteProps {
  symbol: string
}

const CurrentQuote = ({ symbol }: CurrentQuoteProps) => {
  // TODO this is really getting the latest quote, not the latest trade via apca. Need
  // to extend apca to get the latest trade
  const { isLoading, isError, data, error } = useQuery(['latest', symbol], async () => {
    console.log('fetching latest quote for ', symbol)
    const response = await fetch(`http://localhost:3001/latest?sym=${symbol}`)
    if (!response.ok) {
      console.log('Network error', response.status)
      throw new Error('Network error')
    }
    return response.json()
  })
  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  return (
    <div className="latest-trade">
      {currencyFormat(data.ask_price)} / {currencyFormat(data.bid_price)}
    </div>
  )
}

const currencyFormat = (value: number | bigint) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  return formatter.format(value)
}

export default function Index() {
  const [positions, setPositions] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)

  const rowClass = (data: any) => {
    return {
      'row-accessories': data.category === 'Accessories'
    }
  }

  useEffect(() => {
    loader({}).then((data) => {
      setPositions(data)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Positions</h1>
      <DataTable
        value={positions}
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
        <Column field="cost_basis" header="Cost Basis" body={(row) => currencyFormat(row.filled_avg_price)} />
        <Column field="current" header="Current" body={(row) => <CurrentQuote symbol={row.sym} />}></Column>
      </DataTable>
    </div>
    <Outlet />
    </>
  )
}
