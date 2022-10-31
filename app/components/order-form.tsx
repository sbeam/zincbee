import { useState } from "react"
import { useMutation } from "react-query"
import { useForm, Controller } from "react-hook-form"
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'
import { classNames } from 'primereact/utils'

import QuickQuote from "./quick-quote"

export default function OrderForm() {
  const [symbol, setSymbol] = useState('')

  const [market, setMarket] = useState(false)
  const [hardStop, setHardStop] = useState(true)
  const [hardTarget, setHardTarget] = useState(true)

  const [formData, setFormData] = useState({})
  const [showMessage, setShowMessage] = useState(false)

  const defaultValues = {
    sym: '',
    qty: 0,
    limit: 0,
    stop: 0,
    target: 0
  }

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset
  } = useForm({ defaultValues })

  const onSubmit = async (data: any) => {
    try {
      setFormData(data)
      const response = await fetch('http://localhost:3001/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const result = await response.json()

      setShowMessage(true)
      reset()
      return result
    } catch (error) {
      console.log(error)
    }
  }

  const getFormErrorMessage = (name: string) => {
    const error = errors[name as keyof typeof errors]
    if (error) {
      return <small className="p-error">{error.message}</small>
    }
  }

  return (
    <>
    { showMessage && <div className="p-field">TODO: dialog w details</div> }
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-fluid grid formgrid">
        <div className="col-12 md:col-4">
          Place new order
        </div>
        <div className="col-12 pb-1 md:col-2">
          <div className="flex align-items-center">
            <InputSwitch id="market" checked={market} onChange={(e) => setMarket(e.value)} />
            <label htmlFor="market" className="ml-1 text-sm">
              { market ? 'Market' : 'Limit' } Order
            </label>
          </div>
        </div>
        <div className="col-12 pb-1 md:col-2">
          <div className="flex align-items-center">
            <InputSwitch id="hard_stop" checked={hardStop} onChange={(e) => setHardStop(e.value)} />
            <label htmlFor="hard_stop" className="ml-1 text-sm">
              { hardStop ? 'Hard' : 'Soft' }
            </label>
          </div>
        </div>
        <div className="col-12 pb-1 md:col-2">
          <div className="flex align-items-center">
            <InputSwitch id="hard_target" checked={hardTarget} onChange={(e) => setHardTarget(e.value)} />
            <label htmlFor="hard_target" className="ml-1 text-sm">
              { hardTarget ? 'Hard' : 'Soft' }
            </label>
          </div>
        </div>
        <div className="field col-12 md:col-2"></div>
        <div className="field col-12 md:col-2">
          <span className="p-float-label">
            <Controller name="sym" control={control} rules={{ required: 'Symbol is required'}} render={({ field, fieldState }) => (
              <InputText
                id={field.name}
                {...field}
                className={classNames({ 'p-invalid': fieldState.invalid })}
                onBlur={(e) => setSymbol(e.target.value)}
              />
            )} />
           <label htmlFor="inputsymbol">Symbol</label>
          </span>
          {getFormErrorMessage('sym')}
        </div>
        <div className="field col-12 md:col-2">
          <span className="p-float-label">
            <Controller name="qty" control={control} rules={{ required: 'Quantity is required'}} render={({ field, fieldState }) => (
              <InputNumber id={field.name} onChange={event => field.onChange(event.value)} className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
           <label htmlFor="inputqty">Qty</label>
          </span>
          {getFormErrorMessage('qty')}
        </div>
        <div className="field col-12 md:col-2">
          <div className={classNames({hidden: market})}>
            <div className="flex align-items-center">
             <label htmlFor="limit" className="mr-1">Limit</label>
             <Controller name="limit" control={control} rules={{ required: 'Limit price is required for non-market orders'}} render={({ field, fieldState }) => (
               <InputNumber
                 mode="currency"
                 currency="USD"
                 locale="en-US"
                 id={field.name}
                 onChange={event => field.onChange(event.value)}
                 className={classNames({ 'p-invalid': fieldState.invalid })}
               />)}
             />
            </div>
            <div className="w-full">
              {getFormErrorMessage('limit')}
            </div>
          </div>
        </div>
        <div className="field col-12 md:col-2">
          <div className="flex align-items-center">
           <label htmlFor="stop" className="mr-1">Stop</label>
             <Controller name="stop" control={control} rules={{ required: 'Stop price is required'}} render={({ field, fieldState }) => (
               <InputNumber
                 mode="currency"
                 currency="USD"
                 locale="en-US"
                 id={field.name}
                 onChange={event => field.onChange(event.value)}
                 className={classNames({ 'p-invalid': fieldState.invalid })}
               />)}
             />
          </div>
          <div className="w-full">
            {getFormErrorMessage('stop')}
          </div>
        </div>
        <div className="field col-12 md:col-2">
          <div className="flex align-items-center">
           <label htmlFor="inputtarget" className="mr-1">Target</label>
           <Controller name="target" control={control} rules={{ required: 'Target price is required'}} render={({ field, fieldState }) => (
             <InputNumber
               mode="currency"
               currency="USD"
               locale="en-US"
               id={field.name}
               onChange={event => field.onChange(event.value)}
               className={classNames({ 'p-invalid': fieldState.invalid })}
             />)}
           />
          </div>
          <div className="w-full">
            {getFormErrorMessage('target')}
          </div>
        </div>
        <div className="field col-12 md:col-2">
          <Button label="Submit" className="p-button" />
        </div>
        { symbol &&
          <div className="field col-12 md:col-10">
            <QuickQuote symbol={symbol} />
          </div>
        }
      </div>
    </form>
    </>
  )
}
