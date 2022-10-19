import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useState } from "react";
import { FormattedDate } from '~/components/date'
import { classNames } from 'primereact/utils';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import theme from "primereact/resources/themes/lara-dark-indigo/theme.css";  //theme
import pr from "primereact/resources/primereact.min.css";                  //core css
import icons from "primeicons/primeicons.css";                                //icons


export function links() {
  return [
    { rel: "stylesheet", href: pr },
    { rel: "stylesheet", href: theme },
    { rel: "stylesheet", href: icons },
  ];
}

export async function loader({ start, end }: any) {
  const response = await fetch(`http://localhost:3001/orders?start=${start}&end=${end}`)
  const data = await response.json()
  return data
}

function PositionRow({ position }: any) {
  return(
    <tr className={position.status}>
      <td>
        { position.sym }
      </td>
      <td>
        <FormattedDate isoDate={position.created_at} />
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

function PositionTable({ positions }) {
  return(
    <>
    <table>
      <tr>
        <th>Symbol</th>
        <th>Entered</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Cost Basis</th>
      </tr>
      { positions.map( (position: {}, i: any) =>
        <PositionRow key={i} position={position} />
      )}
    </table>
    </>
  )
}

const dateFormatter = (params: any) => {
  if (params.value) {
    const date = Date.parse(params.value)
    const locale = "en-US"; // TODO: use locale setting https://donavon.com/blog/remix-locale
    const timeZone = "America/New_York"

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone,
    }).format(date);
  }
  return null;
}

export default function Index() {
  // const positions = useLoaderData<typeof loader>();
  const [state, setState] = useState(false)
  const [positions, setPositions] = useState([]);

  const rowClass = (data: any) => {
    return {
      'row-accessories': data.category === 'Accessories'
    }
  }

  useEffect(() => {
    loader({}).then((data) => {
      setPositions(data)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Positions</h1>
      <div className="ag-theme-alpine" style={{ width: "100%", height: "100%" }}>
        <DataTable value={positions} rowClassName={rowClass} responsiveLayout="scroll">
          <Column field="sym" header="Symbol"></Column>
          <Column field="created_at" header="Entered" body={(row) => <FormattedDate isoString={row.created_at} />}></Column>
          <Column field="qty" header="Quantity"></Column>
          <Column field="filled_avg_price" header="Price"></Column>
          <Column field="cost_basis" header="Cost Basis"></Column>
        </DataTable>
      </div>
    </div>
    <Outlet />
    </>
  );
}
