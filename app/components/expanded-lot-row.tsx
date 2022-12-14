import LiquidateForm from '~/components/liquidate-form'
import { useState } from "react"
import { Button } from 'primereact/button'
import { Message, MessageSeverityType } from 'primereact/message'
import { useMutation } from "react-query"

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

  // TODO https://www.primefaces.org/primereact/panel/
  return (
    <div className="expanded-row">
      <div>
        {row.sym}!!
      </div>
      <div>
        { liquidateable(row) && <Liquidate stop={row.stop} symbol={row.sym} orderId={row.client_id} qty={row.qty}/> }
        { cancelable(row) && <Cancel orderId={row.client_id} />}
      </div>
    </div>
  )
}
