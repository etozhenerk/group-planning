import {useContext} from 'react'
import {PreviewContext} from '@preview/PreviewContext'
export const useLogout=()=>{
 const model=useContext(PreviewContext)
 if(!model){throw new Error('Preview context missing')}
 return {mutate:model.logout,isPending:false,error:null}
}
