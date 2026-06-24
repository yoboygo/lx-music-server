import { Hono } from 'hono'
import { SYNC_CODE } from '@/constants'

const app = new Hono<{ Bindings: LX.Env }>()

app.get('/', (c) => {
  return c.text(c.env.SERVER_NAME || 'LX Music Server')
})

app.get('/hello', (c) => {
  return c.text(SYNC_CODE.helloMsg)
})

app.get('/id', async(c) => {
  // Route to a fixed DO instance so server ID generation is atomic (DO serializes requests)
  const doStub = c.env.USER_SYNC.get(c.env.USER_SYNC.idFromName('__server__'))
  return doStub.fetch('https://do/server-id')
})

export default app
