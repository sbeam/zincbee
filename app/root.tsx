import type { MetaFunction } from "@remix-run/node"
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react"
import globalStyleURL from "~/styles/global.css"

export const links = () => {
  return [{ rel: 'stylesheet', href: globalStyleURL }]
}

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Zincbee",
  viewport: "width=device-width,initial-scale=1",
})

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
