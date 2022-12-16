import LiquidateForm from '~/components/liquidate-form'
import { useState } from "react"
import { Button } from 'primereact/button'
import { Message, MessageSeverityType } from 'primereact/message'
import { Panel } from 'primereact/panel'
import currencyFormat from '~/utils/currency-format'
import { useMutation } from "react-query"
import { FormattedDate } from '~/components/date'

import '~/styles/expanded-lot-row.css'

const Liquidate = (props : any) => {
  let [showForm, setShowForm] = useState(false)

  return (
    <>
      <div onClick={() => setShowForm(!showForm)}>
        🚰Liquidate
      </div>
      <div>
        {showForm && <LiquidateForm {...props} />}
      </div>
    </>
  )
}

const cancelOrder = async (orderId: string) => {
  const response = await fetch(`http://localhost:3001/order/cccc${orderId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  const result = await response.json()
  return result
}

const Cancel = (props : { orderId: string }) => {
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<{ severity: MessageSeverityType, detail: string } | undefined>()

  const cancel = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (data, _variables, _context) => {
      console.log('success', data)
      setMessage({severity: 'success', detail: 'Order cancellation request sent'})
    },
    onMutate: () => {
      setShowForm(false)
    }
  })

  const styles = {
    error: {
      color: 'red',
      fontSize: '0.8em'
    }
  }

  const retry = () => {
    cancel.reset()
    setMessage(undefined)
    setShowForm(true)
  }

  return (
    <>
      <div onClick={() => setShowForm(!showForm)}>
        Cancel
      </div>
      {cancel.error && (
        <div style={styles.error}>
          <Message severity="error" text={`There was an error canceling your order: ${cancel.error}`} />
          <Button className="ml-3" onClick={retry}>Retry</Button>
        </div>
      )}
      {message && <Message severity={message.severity} text={message.detail} />}
      <div>
        {showForm && <Button onClick={() => cancel.mutate(props.orderId)}>Cancel</Button>}
      </div>
    </>
  )
}

export const ExpandedLotRow = (row: any) => {
  // should prob be server side
  const cancelable = (row: any) => row.status === 'Pending'
  const liquidateable = (row: any) => row.status === 'Open'

  const side = row.position_type === 'Long' ? 'Bought' : 'Sold Short'

  const rr = (row.filled_avg_price - row.stop_price) / (row.limit_price - row.filled_avg_price)

  const proceeds = row.status === 'Disposed' ? row.disposed_fill_price * row.qty : 0
  const gain = row.status === 'Disposed' ? proceeds - row.cost_basis : 0
  const pct_gain = (gain / row.cost_basis) * 100

  const slip = (row.disposed_fill_price - row.stop_price)
  const slip_pct = slip / row.disposed_fill_price * 100

  const detailHeader = <span>{row.position_type} {row.qty} <strong className="text-lg">{row.sym}</strong></span>

  const firstColStyle = { width: '10em' }

  // TODO https://www.primefaces.org/primereact/panel/
  return (
    <div className="flex flex-row flex-wrap">
      <div className="flex flex-col w-6">
        <Panel header={detailHeader}>
          <div className="grid">
            <div className="col-fixed text-right" style={firstColStyle}>R/R:</div>
            <div className="col">{rr.toFixed(1)}</div>
          </div>
          <div className="grid">
            <div className="col-fixed" style={firstColStyle}><FormattedDate isoString={row.created_at} /></div>
            <div className="col">{side}@ {currencyFormat(row.filled_avg_price)}</div>
          </div>
          {row.status === 'Disposed' && <>
            <div className="grid">
              <div className="col-fixed" style={firstColStyle}><FormattedDate isoString={row.disposed_at} /></div>
              <div className="col">{row.dispose_reason}@ {currencyFormat(row.disposed_fill_price)}</div>
            </div>
            <div className="grid">
              <div className="col-fixed text-right" style={firstColStyle}>Slip:</div>
              <div className="col">{currencyFormat(slip)} ({slip_pct.toFixed(2)}%)</div>
            </div>
            <div className="grid">
              <div className="col-fixed text-right" style={firstColStyle}>Realized:</div>
              <div className="col">{currencyFormat(gain)} ({pct_gain.toFixed(2)}%)</div>
            </div>
          </>}
        </Panel>
      </div>

      <div className="actions">
        { liquidateable(row) && <Liquidate stop={row.stop} symbol={row.sym} orderId={row.client_id} qty={row.qty}/> }
        { cancelable(row) && <Cancel orderId={row.client_id} />}
      </div>
    </div>
  )
}
