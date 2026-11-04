import { useContext } from 'react'
import { PreviewContext } from '@preview/PreviewContext'
export const useSignIn=()=>{
 const model=useContext(PreviewContext)
 if(!model){throw new Error('Preview context missing')}
 return {mutate:model.signIn,isBusy:model.loginBusy,error:model.loginError?new Error(model.loginError):null}
}
