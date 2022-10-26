import { useCallback, useEffect, useState } from "react"
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.css'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'

export default function OrderForm() {
  const [symbol, setSymbol] = useState('')
  const [qty, setQty] = useState<number | null>()
  const [limit, setLimit] = useState<number | null>()
  const [stop, setStop] = useState<number | null>()
  const [target, setTarget] = useState<number | null>()

  const [market, setMarket] = useState(false)
  const [hardStop, setHardStop] = useState(true)
  const [hardTarget, setHardTarget] = useState(true)

  return (
      <div className="p-fluid grid formgrid">
        <div className="col-12 md:col-4">
          Place Order
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
           <InputText id="inputsymbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
           <label htmlFor="inputsymbol">Symbol</label>
          </span>
        </div>
        <div className="field col-12 md:col-2">
          <span className="p-float-label">
           <InputNumber id="inputqty" value={qty} onChange={(e) => setQty(e.value)} />
           <label htmlFor="inputqty">Qty</label>
          </span>
        </div>
        <div className="field col-12 md:col-2">
          {market ? '' : (
            <div className="flex align-items-center">
             <label htmlFor="inputlimit" className="mr-1">Limit</label>
             <InputNumber mode="currency" currency="USD" locale="en-US" id="inputlimit" value={limit} onChange={(e) => setLimit(e.value)} />
            </div>
          )}
        </div>
        <div className="field col-12 md:col-2">
          <div className="flex align-items-center">
           <label htmlFor="inputstoploss" className="mr-1">Stop</label>
           <InputNumber mode="currency" currency="USD" locale="en-US" id="inputstoploss" value={stop} onChange={(e) => setStop(e.value)} />
          </div>
        </div>
        <div className="field col-12 md:col-2">
          <div className="flex align-items-center">
           <label htmlFor="inputtarget" className="mr-1">Target</label>
           <InputNumber mode="currency" currency="USD" locale="en-US" id="inputtarget" value={target} onChange={(e) => setTarget(e.value)} />
          </div>
        </div>
        <div className="field col-12 md:col-2">
          <Button label="Submit" className="p-button-outlined" />
        </div>
      </div>
  )
}
