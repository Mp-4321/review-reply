'use client'

import dynamic from 'next/dynamic'

const WorkflowSettings = dynamic(() => import('./workflow-settings'), { ssr: false })

export default function WorkflowSettingsClient() {
  return <WorkflowSettings />
}
