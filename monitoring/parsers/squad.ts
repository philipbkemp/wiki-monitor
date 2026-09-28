import { expect, Page } from '@playwright/test';
import { navigateToPage, urlMatches } from '../helpers/navigate';
import { readSquadData, writeSquadData, updateSquadSnapshot, type Player, } from '../helpers/snapshot';

export async function checkSquad(dataFile:any,page:Page) {
    const data = await readSquadData(dataFile);

    await navigateToPage(page, data.url);

    const actualUrl = page.url();

    /*
    * Migration check happens BEFORE any squad checks.
    *
    * If redirectUrl exists:
    *   final URL must match redirectUrl.
    *
    * If redirectUrl does not exist:
    *   final URL must remain the base URL.
    *
    * Any mismatch is MIGRATION and this club's test stops here.
    */
    const expectedUrl = data.redirectUrl || data.url;

    if (!urlMatches(actualUrl, expectedUrl)) {
        data.status = 'MIGRATION';
        data.actualUrl = actualUrl;
        data.lastChecked = new Date().toISOString();

        await writeSquadData(dataFile, data);

        throw new Error(
        [
            'MIGRATION detected.',
            `Expected: ${expectedUrl}`,
            `Actual:   ${actualUrl}`,
            'No further checks were performed.',
        ].join('\n')
        );
    }

    /*
    * ---------------------------------------------------------
    * Arsenal-specific page checks go here.
    * ---------------------------------------------------------
    *
    * Replace these selectors with the selectors from Arsenal's
    * actual squad page.
    *
    * The important part is that this section only runs AFTER
    * the migration check has passed.
    */

    const playerElements = page.locator(
        data.selectors.player
    );

    const count = await playerElements.count();

    const scrapedPlayers: Player[] = [];

    for (let i = 0; i < count; i++) {
        const playerElement = playerElements.nth(i);

        const name = (
            await playerElement.locator(data.selectors.name).textContent()
        )?.trim();

        if (!name) {
            continue;
        }

        const positionElement = playerElement.locator(data.selectors.position);
        const numberElement = playerElement.locator(data.selectors.number);

        const position =
            (await positionElement.count()) > 0
                ? (await positionElement.textContent())?.trim()
                : undefined;

        const number =
            (await numberElement.count()) > 0
                ? (await numberElement.textContent())?.trim()
                : undefined;

        scrapedPlayers.push({
            name,
            ...(position ? { position } : {}),
            ...(number ? { number } : {}),
        });
    }

    expect(
        scrapedPlayers.length,
        'Expected to find at least one player'
    ).toBeGreaterThan(0);

    await updateSquadSnapshot(
        dataFile,
        scrapedPlayers,
        actualUrl
    );
}