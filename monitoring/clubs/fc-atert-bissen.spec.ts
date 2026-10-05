import { test } from '@playwright/test';
import path from 'node:path';
import { checkSquad } from "../parsers/squad";

const dataFile = path.resolve(
  process.cwd(),
  'docs/squads/fc-atert-bissen.json'
);

test.describe("FC Atert Bissen",{tag:"@Club"},async()=>{
    test('Squad',{tag:"@SQUAD"}, async ({ page }) => {
        await checkSquad(dataFile,page);
    });
});