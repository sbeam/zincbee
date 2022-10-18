import { Outlet, useLoaderData } from '@remix-run/react'

export async function loader() {
  const response = await fetch('http://localhost:3001/orders')
    const data = await response.json()
    return data
}

function PositionRow({ position }) {
  return(
    <tr className={position.status}>
      <td>
        { position.filled_at }
      </td>
      <td>
        { position.symbol }
      </td>
      <td>
        { position.qty }
      </td>
      <td>
        { position.filled_avg_price }
      </td>
      <td>
        { position.cost_basis }
      </td>
    </tr>
  )
}

function PositionTable(p: {}) {
  const positions = useLoaderData<typeof loader>()
  return(
    <>
    <table>
      { positions.map( (position: {}, i: any) =>
        <PositionRow key={i} position={position} />
      )}
    </table>
    </>
  )
}

export default function Index() {
  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Positions</h1>
      <PositionTable />
    </div>
    <Outlet />
    </>
  );
}
