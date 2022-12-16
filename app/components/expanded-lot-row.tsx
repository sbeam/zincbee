import LiquidateForm from '~/components/liquidate-form'
import { useState } from "react"
import { Button } from 'primereact/button'
import { Message, MessageSeverityType } from 'primereact/message'
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

  const proceeds = row.status === 'Disposed' ? row.disposed_fill_price * row.qty : 0
  const gain = row.status === 'Disposed' ? proceeds - row.cost_basis : 0

  // TODO https://www.primefaces.org/primereact/panel/
  return (
    <div className="expanded-row">
      <div className="details">
        <h3>Details</h3>
        <div>{row.position_type} {row.qty} <strong>{row.sym}</strong></div>
        <table>
          <tbody>
            <tr>
              <td>{side}:</td>
              <td>{currencyFormat(row.filled_avg_price)}</td>
              <td><FormattedDate isoString={row.created_at} /></td>
              <td>{currencyFormat(row.cost_basis)}</td>
            </tr>
              {row.status === 'Disposed' && <tr>
                <td>{row.dispose_reason}:</td>
                <td>{currencyFormat(row.disposed_fill_price)}</td>
                <td><FormattedDate isoString={row.disposed_at} /></td>
                <td>{currencyFormat(proceeds)}</td>
              </tr>}
              {row.status === 'Disposed' && <tr>
                <td colSpan={3} align="right">Net:</td>
                <td>{currencyFormat(gain)}</td>
              </tr>}
            </tbody>
        </table>
      </div>

      <div className="actions">
        { liquidateable(row) && <Liquidate stop={row.stop} symbol={row.sym} orderId={row.client_id} qty={row.qty}/> }
        { cancelable(row) && <Cancel orderId={row.client_id} />}
      </div>
    </div>
  )
}
