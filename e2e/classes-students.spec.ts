import { test, expect } from '@playwright/test'

// Chaque exécution crée de nouvelles données, clairement préfixées "E2E Test",
// pour rester repérables et ne jamais être confondues avec de vraies données
// d'école. Il n'existe pas de suppression de classe dans l'app (les écoles ne
// doivent pas perdre de données par erreur), donc ces enregistrements de test
// persistent — voir e2e/README.md : à lancer uniquement sur une école de test
// jetable, jamais sur un compte de production.
const runId = Date.now()
const className = `E2E Test ${runId}`

test('créer une classe puis y inscrire un élève', async ({ page }) => {
  await test.step('créer une classe', async () => {
    await page.goto('/dashboard/classes')
    await page.locator('input[name="name"]').first().fill(className)
    await page.locator('input[name="level"]').first().fill('Test')
    await page.getByRole('button', { name: 'Ajouter' }).first().click()
    await expect(page.getByText(className)).toBeVisible()
  })

  await test.step('inscrire un élève dans cette classe', async () => {
    await page.goto('/dashboard/eleves/nouveau')
    await page.locator('input[name="firstName"]').fill('Test')
    await page.locator('input[name="lastName"]').fill(`E2E-${runId}`)
    await page.locator('select[name="classId"]').selectOption({ label: className })
    await page.getByRole('button', { name: 'Inscrire' }).click()

    await expect(page).toHaveURL(/\/dashboard\/eleves\/[0-9a-f-]+/)
    await expect(page.getByText(`Test E2E-${runId}`)).toBeVisible()
  })
})
