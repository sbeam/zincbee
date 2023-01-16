import { useQuery } from "react-query"
import currencyFormat from '~/utils/currency-format'
import TimeAgo from 'react-time-ago'

const dateFromIso = (iso: string) => new Date(iso)

// TODO: use snapshot endpoint and show all this cool stuff
// https://alpaca.markets/docs/api-references/market-data-api/stock-pricing-data/historical/#snapshot
export default function QuickQuote({symbol}: {symbol: string}) {
  const { isLoading, isError, error, data: quotes } = useQuery(
    ['quote', symbol],
    async () => {
      const response = await fetch(`http://localhost:3001/quote/${symbol}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Symbol not found")
        } else {
          throw new Error(`Error from server: ${response.status} ${response.statusText}`)
        }
      }
      return response.json()
    },
    {
      refetchInterval: 1000 * 15,
      refetchIntervalInBackground: true
    })

  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  return (
    <>
      <div>
        <div>Bid/Size: <span style={{ backgroundColor: 'var(--red-500)' }}>{currencyFormat(quotes[0].bid_price)}/{quotes[0].bid_size}</span></div>
        <div>Ask/Size: <span style={{ backgroundColor: 'var(--green-500)' }}>{currencyFormat(quotes[0].ask_price)}/{quotes[0].ask_size}</span></div>
        <div className="text-sm">{ quotes[0].time ? <TimeAgo date={dateFromIso(quotes[0].time)} /> : ""}</div>
      </div>
    </>
  )
}
