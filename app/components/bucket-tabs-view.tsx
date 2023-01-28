import { useState, useRef } from "react"
import { useQuery, useMutation } from 'react-query'

import { TabView, TabPanel } from 'primereact/tabview'
import { OverlayPanel } from 'primereact/overlaypanel'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'
import { Menu } from 'primereact/menu'
import { Button } from 'primereact/button'
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup'

import LotsTable from '~/components/lots-table'

interface BucketProps {
  name: string,
  rowid: string,
  lot_count: number,
}

enum MutationMethod {
    Create = "POST",
    Update = "PATCH",
    Delete = "DELETE",
}

const BucketMenu = ({bucket, refetch, rename}: {bucket: BucketProps, refetch: Function, rename: Function}) => {
  const errorToast = useRef<Toast>(null)
  const menu = useRef<Menu>(null)
  const popRef = useRef<HTMLDivElement>(null)

  const { mutate: deleteBucket } = useBucketMutation(MutationMethod.Delete, refetch)

  const confirmDeleteBucket = () => {
    confirmPopup({
      message: "Are you sure you want to delete this bucket?",
      target: popRef.current || undefined,
      icon: 'pi pi-info-circle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        const result = deleteBucket({ bucketName: bucket.name }, { onError: (e: any) => {
          errorToast.current?.show({severity: 'error', summary: 'Error', detail: e.message, life: 3000})
        }})
        return result
      }
    })
  }

  const items = [
    { label: 'Rename', icon: 'pi pi-fw pi-pencil', command: () => rename(true) },
  ]
  if (bucket.lot_count === 0) {
    items.push({ label: 'Delete', icon: 'pi pi-fw pi-trash', command: confirmDeleteBucket })
  }

  return (
    <div ref={popRef} className="bucketMenu">
      <Toast ref={errorToast} position="top-right" />
      <ConfirmPopup />
      <Menu popup model={items} ref={menu} />
      <Button label="" icon="pi pi-cog" className="p-button-text p-button-rounded p-button-sm" onClick={(e: any) => menu.current?.toggle(e)} />
    </div>
  )
}

const useBucketMutation = (method: MutationMethod, onSuccess: Function) => (
  useMutation({
    mutationFn: async ({bucketName, oldBucketName}: { bucketName: string, oldBucketName?: string }) => {
      const url = method === MutationMethod.Update ? `http://localhost:3001/bucket/${oldBucketName}` : 'http://localhost:3001/bucket'
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({name: bucketName}),
        method
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText} - ${result.error}`)
      }
      return result
    },
    onSuccess: () => onSuccess()
  })
)

const BucketTabsView = ({ onChange }: { onChange : Function} ) => {
  const [bucketIndex, setBucketIndex] = useState(0)
  const [renaming, setRenaming] = useState(false)
  const overlayRef = useRef<OverlayPanel>(null)
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
      data[bucketIndex] ? onChange(data[bucketIndex].rowid) : chooseBucket(data.length - 1)
    }
  })

  const { mutate: createBucket } = useBucketMutation(MutationMethod.Create, () => { overlayRef.current?.hide(); refetch() })
  const { mutate: modifyBucket } = useBucketMutation(MutationMethod.Update, () => { setRenaming(false); refetch() })

  const header = (bucket: BucketProps, options: any, active: boolean, renaming: boolean) => {
    if (active && renaming) {
      return (<div className="p-tabview-nav-link" style={{padding: '0.75em'}}>
                <InputText type="text" defaultValue={bucket.name} autoFocus={true}
                  onKeyUp={
                    (e: React.KeyboardEvent) => {
                      e.key === 'Enter' && modifyBucket({oldBucketName: bucket.name, bucketName: (e.target as HTMLInputElement).value}, { onError: handleSaveError})
                    }
                  }
                  onBlur={() => setRenaming(false)}
                  style={{width: `${bucket.name.length}em`}}
                  className="p-inputtext-sm block" />
              </div>)
    } else {
      return (<div className={options.className} onClick={options.onClick}>{bucket.name}</div>)
    }
  }


  if (isLoading) return <p>...</p>
  if (isError && error instanceof Error) return <p>{error.message}</p>

  const chooseBucket = (i: number) => {
    setBucketIndex(i)
    onChange(buckets[i].rowid)
  }

  const addBucketButton = (_options: any) => {
    return  (
      <div className="flex align-items-center px-3 pi pi-plus" style={{ cursor: 'pointer' }} onClick={(e) => overlayRef.current?.toggle(e)} />
    )
  }

  const handleSaveError = (err: any) => {
    errorToast.current?.show({severity: 'error', summary: 'Error', detail: err.message, life: 3000})
  }

  return (
    <>
    <Toast ref={errorToast} position="top-right" />
    <TabView activeIndex={bucketIndex} onTabChange={(e) => chooseBucket(e.index)} scrollable className="bucketTabs">
      {buckets.map((bucket: { rowid: string, name: string, lot_count: number }, i: number) => {
        return (
          <TabPanel headerTemplate={(options) => header(bucket, options, (i === bucketIndex), renaming)} key={bucket.rowid} leftIcon="pi pi-fw pi-home">
            <BucketMenu bucket={bucket} refetch={refetch} rename={setRenaming} />
            <LotsTable bucket={bucket.rowid} />
          </TabPanel>
        )
      })}
      <TabPanel headerTemplate={addBucketButton} headerClassName="flex align-items-center" />
    </TabView>
    <OverlayPanel ref={overlayRef} dismissable style={{width: '300px'}} onShow={() => inputRef.current?.focus({preventScroll: true})} >
      <InputText type="text" className="p-inputtext-sm block mb-2" ref={inputRef}
                 onKeyUp={
                   (e: React.KeyboardEvent) => e.key === 'Enter' && createBucket({ bucketName: (e.target as HTMLInputElement).value }, { onError: handleSaveError})
                 } />
    </OverlayPanel>
    </>
  )
}

export default BucketTabsView
