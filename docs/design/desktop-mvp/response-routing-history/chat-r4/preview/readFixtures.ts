import {useChatModel} from '@preview/ChatContext'
import {meeting,people} from '@preview/data'
export const useMeeting=()=>({data:meeting,isPending:false,error:null,access:{denied:false},refetch:async()=>undefined})
export const usePreparationTask=(_meeting:string,id:string)=>({data:useChatModel().tasks[id],isPending:false,error:null,access:{denied:false},refetch:async()=>undefined})
export const useDatePoll=()=>({data:useChatModel().poll,isPending:false,error:null,access:{denied:false},refetch:async()=>undefined})
export const usePlacePoll=()=>({data:useChatModel().placePoll,isPending:false,error:null,access:{denied:false},refetch:async()=>undefined})
export const useReaders=(_meeting:string,_user:string,entry:string)=>({data:{pages:[{readers:useChatModel().scenario==='not-read'||entry==='own-unread'?[]:people}]},denied:false,isPending:false,isSuccess:true,error:null,hasNextPage:false,isFetchingNextPage:false,isFetchNextPageError:false,expired:false,refetch:async()=>undefined,fetchNextPage:async()=>undefined})
export const useMediaImage=(_meeting:string,id:string)=>({src:useChatModel().media[id]??'./dinner.png',loading:false,error:null,retry:()=>undefined})
export const useCoverImage=()=>({src:'./dinner.png',loading:false,error:null})
