import { useState, useRef } from "react"
import { useQuery, useMutation } from 'react-query'

import { TabView, TabPanel } from 'primereact/tabview'
import { OverlayPanel } from 'primereact/overlaypanel'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { Menu } from 'primereact/menu'
import { Button } from 'primereact/button'

import LotsTable from '~/components/lots-table'

const BucketMenu = ({deletable}: {deletable: boolean}) => {
  const menu = useRef<Menu>(null)

  const items = [
    { label: 'Rename', icon: 'pi pi-fw pi-pencil', command: (_e) => { console.log('mm', _e)} },
  ]
  if (deletable) {
    items.push({ label: 'Delete', icon: 'pi pi-fw pi-trash', command: (_e) => { console.log('mm', _e)} })
  }

  return (
    <div className="bucketMenu">
      <Menu popup model={items} ref={menu} />
      <Button label="" icon="pi pi-cog" className="p-button-text p-button-rounded p-button-sm" onClick={(e: any) => menu.current?.toggle(e)} />
    </div>
  )
}

const BucketTabsView = ({ onChange }: { onChange : Function} ) => {
  const [bucketIndex, setBucketIndex] = useState(0)
  const [newBucketName, setNewBucketName] = useState("")
  const op = useRef<OverlayPanel>(null)
  const errorToast = useRef<Toast>(null)
  const inputRef = useRef<any>(null)

  const { isLoading, isError, error, refetch, data: buckets } = useQuery('buckets', async () => {
    const response = await fetch('http://localhost:3001/buckets')
    if (!response.ok) {
      throw new Error('Network error')
    }
    return response.json()
  }, {
    refetchOnWindowFocus: false,
    refetchInterval: Infinity,
    cacheTime: Infinity,
    onSuccess: (data) => {
      onChange(data[bucketIndex].rowid)
    }
  })

  const { mutate: postBucket } = useMutation({
    mutationFn: async (newBucketName: string) => {
      const response = await fetch(`http://localhost:3001/bucket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: newBucketName})
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText} - ${result.error}`)
      }
      return result
    },
    onSuccess: () => { op.current?.hide(); refetch() },
  })

  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  const chooseBucket = (i: number) => {
    setBucketIndex(i)
    onChange(buckets[i].rowid)
  }

  const addBucketButton = (_options: any) => {
    return  (
      <div className="flex align-items-center px-3 pi pi-plus" style={{ cursor: 'pointer' }} onClick={(e) => op.current?.toggle(e)} />
    )
  }

  const saveBucket = (e: any) => {
    if (e.key === 'Enter') {
      postBucket(newBucketName, { onError: (e: any) => {
        errorToast.current?.show({severity: 'error', summary: 'Error', detail: e.message, life: 3000})
      }})
    }
  }

  return (
    <>
    <Toast ref={errorToast} position="top-right" />
    <TabView activeIndex={bucketIndex} onTabChange={(e) => chooseBucket(e.index)} scrollable className="bucketTabs">
      {buckets.map((bucket: { rowid: string, name: string, lot_count: number }) => {
        return (
          <TabPanel header={bucket.name} key={bucket.rowid} leftIcon="pi pi-fw pi-home">
            <BucketMenu deletable={bucket.lot_count == 0} />
            <LotsTable bucket={bucket.rowid} />
          </TabPanel>
        )
      })}
      <TabPanel headerTemplate={addBucketButton} headerClassName="flex align-items-center" />
    </TabView>
    <OverlayPanel ref={op} dismissable style={{width: '300px'}} onShow={() => inputRef.current?.focus({preventScroll: true})} >
      <InputText type="text" className="p-inputtext-sm block mb-2" ref={inputRef} onKeyUp={saveBucket} onChange={(e) => setNewBucketName(e.target.value)} />
    </OverlayPanel>
    </>
  )
}

export default BucketTabsView
