import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'process publish queue',
  { minutes: 10 },
  internal.publish.processQueue,
  {},
)

export default crons
