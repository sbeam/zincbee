import LiquidateForm from '~/components/liquidate-form'
import { useState } from "react"
import { Button } from 'primereact/button'
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
  const response = await fetch('http://localhost:3001/order', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orderId })
  })
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  const result = await response.json()
  return result
}

const Cancel = (props : { orderId: string }) => {
  let [showForm, setShowForm] = useState(false)
  const cancel = useMutation({ mutationFn: cancelOrder })

  return (
    <>
      <div onClick={() => setShowForm(!showForm)}>
        Cancel
      </div>
      <div>
        {showForm && <Button onClick={() => cancel.mutate(props.orderId)}>Cancel</Button>}
      </div>
    </>
  )
}

export const ExpandedLotRow = (row: any) => {
  console.log(row)
  // should prob be server side
  const cancelable = (row: any) => row.status === 'Open' && (row.broker_status === 'new' || row.broker_status === 'pending_new')
  const liquidateable = (row: any) => row.status === 'Open' && (row.broker_status === 'filled' || row.broker_status === 'partially_filled')

  // TODO https://www.primefaces.org/primereact/panel/
  return (
    <div className="expanded-row">
      <div>
        {row.sym}!!
      </div>
      <div>
        { liquidateable(row) && <Liquidate stop={row.stop} symbol={row.sym} orderId={row.broker_id} qty={row.qty}/> }
        { cancelable(row) && <Cancel orderId={row.rowid} />}
      </div>
    </div>
  )
}
