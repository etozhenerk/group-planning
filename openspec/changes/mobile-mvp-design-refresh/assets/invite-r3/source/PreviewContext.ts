import { createContext } from 'react'
import type { useInvitationPreview } from '@preview/useInvitationPreview'
export const PreviewContext=createContext<ReturnType<typeof useInvitationPreview>|null>(null)
