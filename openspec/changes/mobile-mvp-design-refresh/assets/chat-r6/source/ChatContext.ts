import {createContext,useContext} from 'react'
import type {useChatPreview} from '@preview/useChatPreview'
export const ChatContext=createContext<ReturnType<typeof useChatPreview>|null>(null)
export const useChatModel=()=>{
 const model=useContext(ChatContext)
 if(!model){throw new Error('Chat preview context missing')}
 return model
}
