import { useContext } from 'react'
import { PushContext } from './CustomPushProvider'
import { PushContextValue } from './types'

export function usePushMessage(): PushContextValue {
  const ctx = useContext(PushContext)
  if (!ctx) {
    throw new Error(
      'usePushMessage must be used inside <CustomPushProvider>. ' +
      'Wrap your app root with <CustomPushProvider config={...}>.'
    )
  }
  return ctx
}
