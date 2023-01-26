import { Outlet } from '@remix-run/react'
import { useState } from "react"
import { QueryClient, QueryClientProvider } from 'react-query'

import theme from "primereact/resources/themes/lara-dark-indigo/theme.css"  //theme
import pr from "primereact/resources/primereact.min.css"                  //core css
import pf from 'primeflex/primeflex.css';
import icons from "primeicons/primeicons.css"                                //icons
import overrides from "../styles/overrides.css"                              //overrides

import OrderForm from '~/components/order-form'
import BucketTabsView from '~/components/bucket-tabs-view'
import NavBar from '~/components/nav-bar'

const queryClient = new QueryClient()

export function links() {
  return [
    { rel: "stylesheet", href: pr },
    { rel: "stylesheet", href: pf },
    { rel: "stylesheet", href: theme },
    { rel: "stylesheet", href: icons },
    { rel: "stylesheet", href: overrides },
  ]
}

export default function Index() {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [bucketId, setBucketId] = useState(null)

  const toggleOrderForm = () => {
    setShowOrderForm(!showOrderForm)
  }

  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <QueryClientProvider client={queryClient}>
        <NavBar toggleOrderForm={toggleOrderForm} />
        <OrderForm visible={showOrderForm} setVisible={setShowOrderForm} bucketId={bucketId} />
        <BucketTabsView onChange={setBucketId}  />
      </QueryClientProvider>
    </div>
    <Outlet />
    </>
  )
}
