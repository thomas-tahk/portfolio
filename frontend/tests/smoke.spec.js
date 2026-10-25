import { test } from './fixtures.js'
import { standardChecks } from './standardChecks.js'

test('/ passes standard checks', async ({ page }) => {
  await standardChecks(page, '/')
})
