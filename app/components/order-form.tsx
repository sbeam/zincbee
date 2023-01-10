import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css'
import { Sidebar } from 'primereact/sidebar'
import { InputText } from 'primereact/inputtext'
import { Ripple } from 'primereact/ripple'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
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
    target: 0,
    time_in_force: 'gtc',
    side: 'long',
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

  const timeInForceOptions = [
    { name: 'Day', code: 'day' },
    { name: 'Good Till Cancel', code: 'gtc' },
    { name: 'Fill or Kill', code: 'fok' },
    { name: 'Immediate or Cancel', code: 'ioc' }
  ]

  const sideOptions = [
    { name: 'Long', code: 'long' },
    { name: 'Short', code: 'short' },
  ]

  const [visibleLeft, setVisibleLeft] = useState(true)

  return (
    <>
    <Sidebar visible={visibleLeft} onHide={() => setVisibleLeft(false)} style={{width: '22rem'}}>
      <h1 className="bordered-small-header mb-3">Place new order</h1>
      { showMessage && <div className="p-field">TODO: dialog w details</div> }
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="block mb-3 mt-3">
          { symbol ? <QuickQuote symbol={symbol} /> : <p className="text-sm">Enter a symbol and quantity for the order</p> }
        </div>
        <div className="flex align-items-center mb-3">
          <div className="flex flex-grow-1">
            <span className="field">
              <label className="block text-sm mb-1" htmlFor="sym">Symbol</label>
              <Controller name="sym" control={control} rules={{ required: 'Symbol is required'}} render={({ field, fieldState }) => (
                <InputText
                  id={field.name}
                  {...field}
                  className={classNames('w-6rem', { 'p-invalid': fieldState.invalid })}
                  onBlur={(e) => setSymbol(e.target.value)}
                />
              )} />
            </span>
            {getFormErrorMessage('sym')}
          </div>
          <div className="flex flex-grow-1">
            <span className="field">
              <label className="block text-sm mb-1" htmlFor="qty">Qty</label>
              <Controller name="qty" control={control} rules={{ required: 'Quantity is required'}} render={({ field, fieldState }) => (
                <InputNumber
                  id={field.name}
                  onChange={event => field.onChange(event.value)}
                  className={classNames('input-4em', { 'p-invalid': fieldState.invalid })}
                  />
              )} />
            </span>
            {getFormErrorMessage('qty')}
          </div>
          <div className="flex flex-grow-1" style={{marginTop: '0.3rem'}}>
               <Controller name="side" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                 <Dropdown
                   optionLabel="name"
                   optionValue="code"
                   options={sideOptions}
                   id={field.name}
                   value={field.value || "long"}
                   onChange={event => field.onChange(event.value)}
                   className={classNames({ 'p-invalid': fieldState.invalid })}
                 />)}
               />
          </div>
        </div>
        <div className="flex align-items-center">
          <div className="flex flex-grow-1 justify-content-end">
            <label htmlFor="limit" className="mr-3">{ market ? 'Market Order' : 'Buy Limit' }</label>
          </div>
          <div className="flex flex-none">
             <Controller name="limit" control={control} rules={{ required: 'Limit price is required for non-market orders'}} render={({ field, fieldState }) => (
               <InputNumber
                 mode="currency"
                 currency="USD"
                 locale="en-US"
                 id={field.name}
                 onChange={event => field.onChange(event.value)}
                 className={classNames('input-7em', { 'p-disabled': market, 'p-invalid': fieldState.invalid })}
               />)}
             />
          </div>
          <div className="flex flex-none">
            <div className="flex flex-none" style={{scale: '60%'}}>
              <InputSwitch id="market" checked={market} onChange={(e) => setMarket(e.value)} tooltip={ market ? 'Market Order' : 'Limit order' } tooltipOptions={{position: 'bottom'}} />
            </div>
          </div>
        </div>
        <div className="text-xs mb-3 text-right">{getFormErrorMessage('limit')}</div>
        <div className="flex align-items-center">
           <div className="flex flex-grow-1 justify-content-end">
             <label htmlFor="stop" className="mr-3">Sell Stop</label>
           </div>
           <div className="flex flex-none">
               <Controller name="stop" control={control} rules={{ required: 'Stop price is required'}} render={({ field, fieldState }) => (
                 <InputNumber
                   mode="currency"
                   currency="USD"
                   locale="en-US"
                   id={field.name}
                   onChange={event => field.onChange(event.value)}
                   className={classNames('input-7em', { 'p-invalid': fieldState.invalid })}
                 />)}
               />
           </div>
           <div className="flex flex-none">
             <div className="flex flex-none" style={{scale: '60%'}}>
               <InputSwitch id="hard_stop" checked={hardStop} onChange={(e) => setHardStop(e.value)} tooltip={ hardStop ? 'Hard stop' : 'Soft stop' } tooltipOptions={{position: 'bottom'}} />
             </div>
           </div>
        </div>
        <div className="text-xs mb-3 text-right">{getFormErrorMessage('stop')}</div>
        <div className="flex align-items-center">
           <div className="flex flex-grow-1 justify-content-end">
             <label htmlFor="target" className="mr-3">Profit Target</label>
           </div>
           <div className="flex flex-none">
             <Controller name="target" control={control} rules={{ required: 'Target price is required'}} render={({ field, fieldState }) => (
               <InputNumber
                 mode="currency"
                 currency="USD"
                 locale="en-US"
                 id={field.name}
                 onChange={event => field.onChange(event.value)}
                 className={classNames('input-7em', {'p-invalid': fieldState.invalid })}
               />)}
             />
           </div>
           <div className="flex flex-none">
             <div className="flex flex-none" style={{scale: '60%'}}>
               <InputSwitch id="hard_target" checked={hardTarget} onChange={(e) => setHardTarget(e.value)} tooltip={ hardTarget ? 'Hard target' : 'Soft target' } tooltipOptions={{position: 'bottom'}} />
             </div>
           </div>
        </div>

        <div className="text-xs mb-3 text-right">{getFormErrorMessage('target')}</div>

        <div className="flex align-items-center">
           <div className="flex flex-grow-1 justify-content-end">
             <label htmlFor="stop" className="mr-3 text-sm white-space-nowrap">Time in Force</label>
           </div>
           <div className="flex flex-none justify-content-end">
             <Controller name="time_in_force" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
               <Dropdown
                 optionLabel="name"
                 optionValue="code"
                 options={timeInForceOptions}
                 id={field.name}
                 value={field.value || "gtc"}
                 onChange={event => field.onChange(event.value)}
                 placeholder="Select Time in Force"
                 className={classNames({ 'p-invalid': fieldState.invalid })}
               />)}
             />
          </div>
        </div>
        <div className="flex align-items-end justify-content-end">
          <Button label="Submit" className="flex p-button" style={{scale: '80%'}}/>
        </div>
       </form>
      </Sidebar>
    </>
  )
}
