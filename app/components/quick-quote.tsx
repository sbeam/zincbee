import { useQuery } from "react-query"
import currencyFormat from '~/utils/currency-format'
import TimeAgo from '~/components/time-ago'

export default function QuickQuote({symbol}: {symbol: string}) {
  const { isLoading, isError, error, data: quote } = useQuery(
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
        <div>Bid/Size: {currencyFormat(quote.bid_price)}/{quote.bid_size}</div>
        <div>Ask/Size: {currencyFormat(quote.ask_price)}/{quote.ask_size}</div>
        <div><TimeAgo date={quote.time} /></div>
      </div>
    </>
  )
}
