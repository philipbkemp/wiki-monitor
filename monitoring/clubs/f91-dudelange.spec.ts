import { test } from '@playwright/test';
import path from 'node:path';
import { checkSquad } from "../parsers/squad";

const dataFile = path.resolve(
  process.cwd(),
  'docs/squads/f91-dudelange.json'
);

test.describe("F91 Dudelange",{tag:"@Club"},async()=>{
    test('Squad',{tag:"@SQUAD"}, async ({ page }) => {
        await checkSquad(dataFile,page);
    });
});