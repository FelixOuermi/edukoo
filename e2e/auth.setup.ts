import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/director.json'

setup('authenticate as director', async ({ page }) => {
  const email = process.env.E2E_DIRECTOR_EMAIL
  const password = process.env.E2E_DIRECTOR_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_DIRECTOR_EMAIL et E2E_DIRECTOR_PASSWORD doivent être définis (voir e2e/README.md). ' +
        "Utilise un compte école de TEST dédié, jamais un compte de production : ces tests créent " +
        'de vraies classes et de vrais élèves dans l\'école du compte utilisé.'
    )
  }

  await page.goto('/auth/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.context().storageState({ path: authFile })
})
