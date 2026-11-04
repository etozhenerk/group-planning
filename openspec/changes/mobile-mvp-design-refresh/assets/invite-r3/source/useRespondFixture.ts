import { useContext } from 'react'
import { PreviewContext } from '@preview/PreviewContext'
export const useRespond=()=>{
 const model=useContext(PreviewContext)
 if(!model){throw new Error('Preview context missing')}
 return {saved:model.saved,mutation:{isPending:model.responseBusy,error:model.responseError?new Error(model.responseError):null,mutate:model.respond}}
}
