import { test, expect } from '@playwright/test'

test('le tableau de bord directeur se charge avec ses indicateurs', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  await expect(page.getByText('Élèves actifs')).toBeVisible()
  await expect(page.getByText('Taux de recouvrement')).toBeVisible()
})

test('la checklist de prise en main peut se replier et se fermer', async ({ page }) => {
  await page.goto('/dashboard')

  const checklistHeading = page.getByRole('heading', { name: "Prise en main d'Edukoo" })

  if (!(await checklistHeading.isVisible().catch(() => false))) {
    test.skip(true, 'Checklist absente (déjà terminée ou fermée précédemment sur ce compte) — rien à tester.')
  }

  const toggleButton = checklistHeading.locator('xpath=ancestor::button[1]')
  const firstStepLink = page.locator('ul li a').first()

  await expect(firstStepLink).toBeVisible()
  await toggleButton.click()
  await expect(firstStepLink).toBeHidden()
  await toggleButton.click()
  await expect(firstStepLink).toBeVisible()

  const closeButton = page.getByRole('button', { name: 'Fermer' })
  await closeButton.click()
  await expect(checklistHeading).toBeHidden()

  // La fermeture est mémorisée en localStorage : un rechargement ne doit pas la faire réapparaître.
  await page.reload()
  await expect(checklistHeading).toBeHidden()
})
