import { Form, Outlet, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useState } from "react";
import { FormattedDate } from '~/components/date'
import { AgGridReact } from "ag-grid-react";
import AgGridStyles from "ag-grid-community/dist/styles/ag-grid.css";
import AgThemeAlpineStyles from "ag-grid-community/dist/styles/ag-theme-alpine.css";

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
  const [isFetching, setIsFetching] = useState(false);
  const [getRowParams, setGetRowParams] = useState(null);
  const [rowData, setRowData] = useState([])

  const positions = useLoaderData<typeof loader>();

  const onGridReady = (params: any) => {
    const api = params.api;
    const datasource = {
      getRows(params: any) {
        if (!isFetching) {
          setIsFetching(true);
          loader({ start: params.startRow, end: params.endRow }).then((data: any) => {
            console.log(data)
            api.setRowData(data)
            setIsFetching(false);
          })

          setGetRowParams(params);
        }
      },
    };

    api.setDatasource(datasource);
  }


  //  useEffect(() => {
  //    if (getRowParams) {
  //      const data = positions.data || [];
  //      console.log(data )

  //      getRowParams.successCallback(
  //        data,
  //        data.length < getRowParams.endRow - getRowParams.startRow ? getRowParams.startRow : -1
  //      )
  //    }

  //    setIsFetching(false);
  //    setGetRowParams(null);
  //  }, [rowData])


  const columnDefs = [
    { field: "symbol" },
    { field: "entered", valueFormatter: dateFormatter, },
    { field: "qty", flex: 1, minWidth: 100 },
    { field: "price", minWidth: 250 },
    { field: "cost.basis" },
  ]

  return (
    <>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Positions</h1>
      <div className="ag-theme-alpine" style={{ width: "100%", height: "100%" }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowModelType="infinite"
          onGridReady={onGridReady}
        />
      </div>
    </div>
    <Outlet />
    </>
  );
}

export function links() {
  return [
    { rel: "stylesheet", href: AgGridStyles },
    { rel: "stylesheet", href: AgThemeAlpineStyles },
  ];
}
