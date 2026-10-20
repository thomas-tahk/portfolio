import { test } from '@playwright/test'
import { standardChecks } from './standardChecks.js'

test('/ passes standard checks', async ({ page }) => {
  await standardChecks(page, '/')
})
