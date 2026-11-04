import {useChatPreview} from '@preview/useChatPreview'
import {ChatContext} from '@preview/ChatContext'
import {ChatScreen} from '@preview/ChatScreen'
export const ChatPreview=()=>{const model=useChatPreview();return <ChatContext.Provider value={model}><ChatScreen/></ChatContext.Provider>}
