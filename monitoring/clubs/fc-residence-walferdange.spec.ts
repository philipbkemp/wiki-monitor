import { test } from '@playwright/test';
import path from 'node:path';
import { checkSquad } from "../parsers/squad";

const dataFile = path.resolve(
  process.cwd(),
  'docs/squads/fc-residence-walferdange.json'
);

test.describe("FC Résidence Walferdange",async()=>{
    test('Squad', async ({ page }) => {
        await checkSquad(dataFile,page);
    });
});