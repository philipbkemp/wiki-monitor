const clubs = [
    "f91-dudelange",
    "fc-residence-walferdange",
    "fc-atert-bissen"
];

const clubData = new Map();

async function loadClub(club) {
    const response = await fetch(`squads/${club}.json`);
    if ( ! response.ok ) {
        throw new Error(`Could not load squads/${club}.json`);
    }
    return await response.json();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
    ;
}

function renderClubRow(data) {
    clubData.set(data.club,data);
    let squadCell = "";
    switch ( data.status ) {
        case "OKAY":
            squadCell = '<span class="status pass">PASS</span>';
            break;
        case "UPDATED":
            squadCell = `<span class="status fail" data-squad="${escapeHtml(data.club)}">FAIL</span>`;
            break;
        case "MIGRATION":
            squadCell = '<span class="status migration">MIGRATION</span>';
            break;
        default:
            squadCell = '<span class="status fail">ERROR</span>';
    }

    return `<tr><td>${escapeHtml(data.club)}</td><td>${squadCell}</td></tr>`;
}

function renderTable(results) {
    const content = document.getElementById("content");
    clubData.clear();
    let rows = "";

    for ( const res of results ) {
        if ( res.error ) {
            rows += `<tr><td>${escapeHTML(res.club)}</td><td><span class="status fail">ERROR</span></td></tr>`;
        } else {
            rows += renderClubRow(res.data);
        }
    }

    content.innerHTML = `<table><thead><tr><th>Club</th><th>Squad</th></tr></thead><tbody>${rows}</tbody></table>`;

    document.querySelectorAll(".status.fail[data-squad]").forEach(cell=>{
        cell.addEventListener("click",()=>{
            const club = cell.dataset.squad;
            const data = clubData.get(club);
            if ( data ) {
                openSquadChanges(data);
            }
        });
    });
}

function openSquadChanges(data) {
    document.getElementById("modal-title").textContent = `${data.club} - Squad Changes`;
    let html = "";

    if ( data.newPlayers && data.newPlayers.length > 0 ) {
        html += '<div class="change-section new"><h3>New players</h3><ul>';
        for ( const player of data.newPlayers ) {
            html += `<li>${escapeHtml(player.name)}</li>`;
        }
        html += '</ul></div>';
    }

    if ( data.departedPlayers && data.departedPlayers.length > 0 ) {
        html += '<div class="change-section departed"><h3>Departed players</h3><ul>';
        for ( const player of data.departedPlayers ) {
            html += `<li>${escapeHtml(player.name)}</li>`;
        }
        html += '</ul></div>';
    }

    if ( data.changedPlayers && data.changedPlayers.length > 0 ) {
        html += '<div class="change-section changed"><h3>Changed players</h3><ul>';
        for ( const player of data.changedPlayers ) {
            html += `<li><strong>${escapeHtml(player.name)}</strong><div class="change-detail">`;
            if ( player.changes.position ) {
                html += `<span>Position: ${escapeHtml(player.changes.position.old ?? "__")} > ${escapeHtml(player.changes.position.new ?? "__")}</span>`;
            }
            if ( player.changes.number ) {
                html += `<span>Number: ${escapeHtml(player.changes.number.old ?? "__")} > ${escapeHtml(player.changes.number.new ?? "__")}</span>`;
            }
            html += '</div></li>';
        }
        html += '</ul></div>';
    }

    document.getElementById("modal-body").innerHTML = html;
    document.getElementById("modal-backdrop").classList.add("visible");
}

function closeModal() {
    document.getElementById("modal-backdrop").classList.remove("visible");
    document.querySelector(".modal").classList.remove("modal-bounce");
}

document.getElementById("close-modal").addEventListener("click",closeModal);

document.getElementById("modal-backdrop").addEventListener("click",event=>{
    if ( event.target === document.getElementById("modal-backdrop") ) {
        const modal = document.querySelector(".modal");
        modal.classList.remove("modal-bounce");
        void modal.offsetWidth;
        modal.classList.add("modal-bounce");
    }
});

async function loadAllClubs() {
    const results = [];
    for ( const club of clubs ) {
        try {
            const data = await loadClub(club);
            results.push({club,data});
        } catch (error) {
            results.push({club,error:error instanceof Error ? error.message : String(error)});
        }
        renderTable(results);
    }
}

loadAllClubs();