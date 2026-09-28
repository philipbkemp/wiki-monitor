import fs from 'node:fs/promises';

export type SquadStatus =
    | 'OKAY'
    | 'UPDATED'
    | 'MIGRATION';

export interface Player {
    name: string;
    position?: string;
    number?: string;
    url?: string;
}

export interface PlayerChange {
    name: string;
    changes: {
        position?: {
            old: string | null;
            new: string | null;
        };
        number?: {
            old: string | null;
            new: string | null;
        };
    };
}

export interface PlayerSelector {
    player: string,
    name: string,
    number: string,
    position: string
}

export interface SquadData {
    club: string;
    url: string;
    redirectUrl?: string | null;
    actualUrl?: string | null;
    lastChecked: string | null;
    status: SquadStatus;
    knownPlayers: Player[];
    newPlayers: Player[];
    departedPlayers: Player[];
    changedPlayers: PlayerChange[];
    selectors: PlayerSelector;
}

function normaliseName(name: string): string {
    return name
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

export async function readSquadData(
    filePath: string
): Promise<SquadData> {
    const contents = await fs.readFile(
        filePath,
        'utf8'
    );

    return JSON.parse(contents) as SquadData;
}

export async function writeSquadData(
    filePath: string,
    data: SquadData
): Promise<void> {
    await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2) + '\n',
        'utf8'
    );
}

export async function updateSquadSnapshot(
    filePath: string,
    scrapedPlayers: Player[],
    actualUrl: string
): Promise<SquadData> {
    const data = await readSquadData(filePath);

    const knownByName = new Map(
        data.knownPlayers.map((player) => [
            normaliseName(player.name),
            player,
        ])
    );

    const scrapedByName = new Map(
        scrapedPlayers.map((player) => [
            normaliseName(player.name),
            player,
        ])
    );

    /*
     * Find new players.
     */
    const newPlayers = scrapedPlayers.filter(
        (player) =>
            !knownByName.has(
                normaliseName(player.name)
            )
    );

    /*
     * Find departed players.
     */
    const departedPlayers =
        data.knownPlayers.filter(
            (player) =>
                !scrapedByName.has(
                    normaliseName(player.name)
                )
        );

    /*
     * Find changed player attributes.
     */
    const changedPlayers: PlayerChange[] = [];

    for (const knownPlayer of data.knownPlayers) {
        const scrapedPlayer =
            scrapedByName.get(
                normaliseName(knownPlayer.name)
            );

        if (!scrapedPlayer) {
            continue;
        }

        const changes: PlayerChange['changes'] = {};

        const knownPosition =
            knownPlayer.position ?? null;

        const scrapedPosition =
            scrapedPlayer.position ?? null;

        if (knownPosition !== scrapedPosition) {
            changes.position = {
                old: knownPosition,
                new: scrapedPosition,
            };
        }

        const knownNumber =
            knownPlayer.number ?? null;

        const scrapedNumber =
            scrapedPlayer.number ?? null;

        if (knownNumber !== scrapedNumber) {
            changes.number = {
                old: knownNumber,
                new: scrapedNumber,
            };
        }

        if (Object.keys(changes).length > 0) {
            changedPlayers.push({
                name: knownPlayer.name,
                changes,
            });
        }
    }

    const hasChanges =
        newPlayers.length > 0 ||
        departedPlayers.length > 0 ||
        changedPlayers.length > 0;

    /*
     * Build the current monitoring state.
     *
     * We deliberately do NOT include lastChecked,
     * because that changes on every run.
     */
    const currentState = {
        actualUrl,
        status: hasChanges
            ? 'UPDATED'
            : 'OKAY',
        newPlayers,
        departedPlayers,
        changedPlayers,
    };

    /*
     * Build the previous monitoring state.
     */
    const previousState = {
        actualUrl: data.actualUrl ?? null,
        status: data.status,
        newPlayers: data.newPlayers ?? [],
        departedPlayers:
            data.departedPlayers ?? [],
        changedPlayers:
            data.changedPlayers ?? [],
    };

    /*
     * If nothing meaningful has changed since the
     * previous run, don't touch the JSON file.
     *
     * This prevents the same alert from generating
     * a new Git commit every hour.
     */
    if (
        JSON.stringify(currentState) ===
        JSON.stringify(previousState)
    ) {
        return data;
    }

    /*
     * Something has changed.
     *
     * Update the monitoring information.
     *
     * knownPlayers is deliberately NEVER modified.
     */
    data.actualUrl = actualUrl;
    data.newPlayers = newPlayers;
    data.departedPlayers = departedPlayers;
    data.changedPlayers = changedPlayers;
    data.status = hasChanges
        ? 'UPDATED'
        : 'OKAY';
    data.lastChecked =
        new Date().toISOString();

    await writeSquadData(
        filePath,
        data
    );

    return data;
}