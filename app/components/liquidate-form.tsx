import { useState } from "react"
import { useMutation } from "react-query"
import { useForm, Controller } from "react-hook-form"

import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { classNames } from 'primereact/utils'
import { Dropdown } from 'primereact/dropdown'
import { ProgressSpinner } from 'primereact/progressspinner'

const liquidate = async (data: { orderId: string, stop: number }) => {
  const response = await fetch('http://localhost:3001/liquidate', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  const result = await response.json()
  return result
}

export default function LiquidateForm({ stop, orderId } : { stop: number, orderId: string }) {
  const { control, handleSubmit, reset } = useForm()
  const mutation = useMutation({ mutationFn: liquidate })

  const [orderType, setOrderType] = useState('market')

  const orderTypeOptions = [
    { name: 'Market', value: 'market' },
    { name: 'Sell Stop', value: 'stop' },
  ]

  const onSubmit = async (data: any) => {
    mutation.mutate(Object.assign(data, { id: orderId, orderType }))
    reset()
  }

  return (
    <div>
      <div>
        <h1 className="font-bold">Liquidate</h1>
        <p className="text-sm text-gray-600">Enter sell stop or market order to cancel any outstanding sell orders and liquidate this position.</p>
      </div>
      {mutation.isLoading && <div className=""><ProgressSpinner /></div>}
      {mutation.isError && <div className="text-red-500">Error</div>}
      {mutation.isSuccess && <div className="text-green-500">Success</div>}
      {mutation.isIdle && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-fluid grid formgrid">
            <div className="col-12 md:col-2">
              <Dropdown optionLabel="name" optionValue="value" value={orderType} options={orderTypeOptions} onChange={(e) => setOrderType(e.value)} />
            </div>
            <div className="col-12 md:col-2">
              { orderType == 'stop' && <Controller
                name="stop"
                control={control}
                defaultValue={stop}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <InputNumber
                    mode="currency"
                    value={field.value}
                    currency="USD"
                    locale="en-US"
                    id={field.name}
                    onChange={event => field.onChange(event.value)}
                    className={classNames({ 'p-invalid': fieldState.invalid })}
                  />
                 )}
              />}
            </div>
            <div className="field col-12 md:col-2">
              <Button label="Enter order" className="p-button" />
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
