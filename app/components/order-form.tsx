import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css'
import { Sidebar } from 'primereact/sidebar'
import { InputText } from 'primereact/inputtext'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
import { classNames } from 'primereact/utils'

import QuickQuote from "./quick-quote"
import currencyFormat from '~/utils/currency-format'

export default function OrderForm({ visible, setVisible }: { visible: boolean, setVisible: Function }) {
  const [symbol, setSymbol] = useState('')

  const [market, setMarket] = useState(false)
  const [hardStop, setHardStop] = useState(true)
  const [hardTarget, setHardTarget] = useState(true)

  const [showMessage, setShowMessage] = useState(false) // TODO a toast

  const defaultValues = {
    sym: '',
    qty: 0,
    limit: 0,
    stop: 0,
    target: 0,
    time_in_force: 'gtc',
    side: 'long',
    market: false,
    hard_stop: true
  }

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset
  } = useForm({ defaultValues })

  const onSubmit = async (data: any) => {
    console.log(data)
    try {
      confirmDialog({
        position: 'left',
        message: <div style={{minWidth: '22rem'}}>
          <h4 className="mt-0 mb-3">Confirm Order</h4>
          <div>{data.qty} <span className="txt-bold">{data.sym}</span> {data.side}</div>
          { data.market && <div>Market Order</div> }
          { data.side == 'long' && !data.market && <div>Buy limit: {currencyFormat(data.limit)}</div> }
          { data.side == 'short' && !data.market && <div>Sell to short limit: {currencyFormat(data.limit)}</div> }
          <div>Stop Loss: {currencyFormat(data.stop)} { data.hard_stop ? "" : "(soft)" }</div>
          <div>Profit target: {currencyFormat(data.target)}</div>
          <div>Time in force: {data.time_in_force}</div>
          <div>Est. Cost Basis: {currencyFormat(data.qty * data.limit)}</div>
          <div>Risk/Reward: {((data.target - data.limit) / (data.limit - data.stop)).toFixed(1)}</div>
        </div>,
        accept: async () => {
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
        }
      })
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

  const isPositiveNumber = (value: number) => value > 0

  return (
    <>
    <ConfirmDialog />
    <Sidebar visible={visible} onHide={() => setVisible(false)} style={{width: '22rem'}}>
      <h1 className="bordered-small-header mb-3">Place new order</h1>
      { showMessage && <div className="p-field">TODO: dialog w details</div> }
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="block mb-3 mt-3">
          { symbol ? <QuickQuote symbol={symbol} /> : <p className="text-sm">Enter a symbol and quantity for the order</p> }
        </div>
        <div className="flex align-items-center">
          <div className="flex flex-grow-1">
            <span className="field mb-1">
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
          </div>
          <div className="flex flex-grow-1">
            <span className="field mb-1">
              <label className="block text-sm mb-1" htmlFor="qty">Qty</label>
              <Controller name="qty" control={control} rules={{ required: 'Quantity is required', validate: isPositiveNumber }} render={({ field, fieldState }) => (
                <InputNumber
                  id={field.name}
                  onChange={event => field.onChange(event.value)}
                  className={classNames('input-4em', { 'p-invalid': fieldState.invalid })}
                  />
              )} />
            </span>
          </div>
          <div className="flex flex-grow-1 mt-3">
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
        <div className="mb-3" style={{minHeight: '1rem'}}>
          <div style={{display: 'block'}}>{getFormErrorMessage('sym')}</div>
          <div style={{display: 'block'}}>{getFormErrorMessage('qty')}</div>
        </div>
        <div className="flex align-items-center">
          <div className="flex flex-grow-1 justify-content-end">
            <label htmlFor="limit" className="mr-3">{ market ? 'Market Order' : 'Buy Limit' }</label>
          </div>
          <div className="flex flex-none">
             <Controller name="limit" control={control} rules={{ required: market ? false : 'Limit price is required for non-market orders', validate: isPositiveNumber }} render={({ field, fieldState }) => (
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
             <Controller name="market" control={control} render={({ field }) => (
               <InputSwitch id={field.name} checked={field.value} onChange={(e) => { field.onChange(e.value); setMarket(e.value)}} tooltip={ market ? 'Market Order' : 'Limit order' } tooltipOptions={{position: 'bottom'}} />

               )}
             />
            </div>
          </div>
        </div>
        <div className="text-xs mb-3 text-right">{getFormErrorMessage('limit')}</div>
        <div className="flex align-items-center">
           <div className="flex flex-grow-1 justify-content-end">
             <label htmlFor="stop" className="mr-3">Sell Stop</label>
           </div>
           <div className="flex flex-none">
               <Controller name="stop" control={control} rules={{ required: 'Stop price is required.', validate: isPositiveNumber }} render={({ field, fieldState }) => (
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
             <Controller name="hard_stop" control={control} render={({ field }) => (
               <div className="flex flex-none" style={{scale: '60%'}}>
                 <InputSwitch id={field.name} checked={field.value} onChange={(e) => { field.onChange(e.value); setHardStop(e.value)}} tooltip={ hardStop ? 'Hard stop' : 'Soft stop' } tooltipOptions={{position: 'bottom'}} />
               </div>
               )}
             />
           </div>
        </div>
        <div className="text-xs mb-3 text-right">{getFormErrorMessage('stop')}</div>
        <div className="flex align-items-center">
           <div className="flex flex-grow-1 justify-content-end">
             <label htmlFor="target" className="mr-3">Profit Target</label>
           </div>
           <div className="flex flex-none">
             <Controller name="target" control={control} rules={{ required: 'Target price is required', validate: isPositiveNumber}} render={({ field, fieldState }) => (
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
        <div className="flex align-items-end justify-content-end mt-4">
          <Button label="Submit" className="flex p-button" style={{scale: '80%'}}/>
        </div>
       </form>
      </Sidebar>
    </>
  )
}
