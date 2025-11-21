let musicData = [];
let sortedIndexList = [];
let recordDataList = [];
let parentIndexList = [];

let leftIndex = 0;
let leftInnerIndex = 0;
let rightIndex = 0;
let rightInnerIndex = 0;
let battleNo = 1;
let sortedNo = 0;
let pointer = 0;

let sortedIndexListPrev = [];
let recordDataListPrev = [];
let parentIndexListPrev = [];

let leftIndexPrev = 0;
let leftInnerIndexPrev = 0;
let rightIndexPrev = 0;
let rightInnerIndexPrev = 0;
let battleNoPrev = 1;
let sortedNoPrev = 0;
let pointerPrev = 0;

let totalBattles = 0;

let video = true;
let region = "eu";

fetch('songList.json')
    .then(response => response.json())
    .then(data => {
        musicData = data;
    })
    .catch(error => {
        console.error("Error loading JSON:", error);
    });


configureLoadButton();

function configureLoadButton() {
    let loadButton = document.getElementById("load");
    let title = document.querySelector('.title');
    let battleNoLocal = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-battleNo`));
    let leftIndexLocal = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-leftIndex`));
    if (battleNoLocal == null) {
        loadButton.hidden = true;
        title.textContent = 'Press "Start" to begin sorting.';
        return;
    }

    if (leftIndexLocal == -1) {
        loadButton.textContent = "Show Results";
        title.textContent = 'Press "Start" to begin sorting or "Show Results" to display results of previous sorting.';
    } else {
        loadButton.textContent = "Continue";
        title.textContent = 'Press "Start" to begin sorting or "Continue" to load saved progress and resume where you left.';
    }
}

function showDuel(id1, id2) {
    const duelContainer = document.getElementById('duel');
    duelContainer.innerHTML = "";

	function createMusicCard(music, isLeft) {
    const card = document.createElement('div');
    card.className = 'music-card';

    let mediaElement = null;

    // Verificar si hay video disponible y el modo video está activado
    if (video && music.video) {
        try {
            if (music.video.includes("youtube.com")) {
                const videoId = new URL(music.video).searchParams.get("v");
                mediaElement = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            } else if (music.video.endsWith(".webm") || music.video.endsWith(".mp4")) {
                if (music.video.includes("animemusicquiz")) {
                    mediaElement = `<video controls><source src="https://${region}dist.animemusicquiz.com/${music.video.split('/').pop()}" type="video/webm"></video>`;
                } else {
                    mediaElement = `<video controls><source src="${music.video}" type="video/webm"></video>`;
                }
            }
        } catch (e) {
            console.warn("Error al procesar video:", e);
        }
    }

    // Si no hay video o falló la creación, usar MP3 si existe
    if (!mediaElement && music.mp3) {
        try {
            if (music.mp3.includes("animemusicquiz")) {
                mediaElement = `<audio controls><source src="https://${region}dist.animemusicquiz.com/${music.mp3.split('/').pop()}" type="audio/mp3"></audio>`;
            } else {
                mediaElement = `<audio controls><source src="${music.mp3}" type="audio/mp3"></audio>`;
            }
        } catch (e) {
            console.warn("Error al procesar audio:", e);
        }
    }

    // Si no hay ningún medio disponible
    if (!mediaElement) {
        mediaElement = '<div class="no-media">No hay contenido multimedia disponible</div>';
    }

    card.innerHTML = `
        ${mediaElement}
        <div class="anime">${music.anime || "Anime desconocido"}</div>
        <div class="song">${music.name || "Canción sin nombre"}</div>
    `;

    const button = document.createElement('button');
    button.textContent = "PICK";
    button.addEventListener('click', () => {
        if (isLeft) {
             pick('left');
        } else {
             pick('right');
        }
     });

     card.appendChild(button);
     return card;
    }

    if (id1 < musicData.length && id2 < musicData.length) {
        duelContainer.appendChild(createMusicCard(musicData[id1], true));
        duelContainer.appendChild(createMusicCard(musicData[id2], false));
    } else {
        console.error("Index out of range!");
    }

    const percent = Math.floor(sortedNo * 100 / totalBattles);
    progressBar(`Battle no. ${battleNo}`, percent);

}

function pick(sortType) {

    sortedIndexListPrev = sortedIndexList.slice(0);
    recordDataListPrev = recordDataList.slice(0);
    parentIndexListPrev = parentIndexList.slice(0);

    leftIndexPrev = leftIndex;
    leftInnerIndexPrev = leftInnerIndex;
    rightIndexPrev = rightIndex;
    rightInnerIndexPrev = rightInnerIndex;
    battleNoPrev = battleNo;
    sortedNoPrev = sortedNo;
    pointerPrev = pointer;

    if (sortType === 'left') {
        recordData('left');
    } else {
        recordData('right');
    }

    const leftListLen = sortedIndexList[leftIndex].length;
    const rightListLen = sortedIndexList[rightIndex].length;

    if (leftInnerIndex < leftListLen && rightInnerIndex === rightListLen) {
        while (leftInnerIndex < leftListLen) {
            recordData('left');
        }
    } else if (leftInnerIndex === leftListLen && rightInnerIndex < rightListLen) {
        while (rightInnerIndex < rightListLen) {
            recordData('right');
        }
    }

    if (leftInnerIndex === leftListLen && rightInnerIndex === rightListLen) {
        for (let i = 0; i < leftListLen + rightListLen; i++) {
            sortedIndexList[parentIndexList[leftIndex]][i] = recordDataList[i];
        }
        sortedIndexList.pop();
        sortedIndexList.pop();
        leftIndex = leftIndex - 2;
        rightIndex = rightIndex - 2;
        leftInnerIndex = 0;
        rightInnerIndex = 0;

        sortedIndexList.forEach((val, idx) => recordDataList[idx] = 0);
        pointer = 0;
    }

    if (leftIndex < 0) {
        progressBar(`Completed! (${battleNo} battles)`, 100);
        autoSave();
        result();
    } else {
        battleNo++;
        autoSave();
        showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);
    }
}

function recordData(sortType) {
    if (sortType === 'left') {
        recordDataList[pointer] = sortedIndexList[leftIndex][leftInnerIndex];
        leftInnerIndex++;
    } else {
        recordDataList[pointer] = sortedIndexList[rightIndex][rightInnerIndex];
        rightInnerIndex++;
    }

    pointer++;
    sortedNo++;
}

function start() {
    document.querySelector('.title').style.display = "none";
    document.getElementById("start").style.display = "none";
    document.getElementById("load").style.display = "none";

    let button1 = document.createElement("button");
    button1.classList.add("basic-button");
    button1.textContent = "Undo";
    button1.addEventListener("click", undo);

    let container = document.querySelector(".button-container");
    container.appendChild(button1);

    musicDataToSort = musicData.slice(0);
    recordDataList = musicDataToSort.map(() => 0);
    sortedIndexList[0] = musicDataToSort.map((val, idx) => idx);
    parentIndexList[0] = -1;

    let midpoint = 0;   // Indicates where to split the array.
    let marker = 1;   // Indicates where to place our newly split array.

    for (let i = 0; i < sortedIndexList.length; i++) {
        if (sortedIndexList[i].length > 1) {
            let parent = sortedIndexList[i];
            midpoint = Math.ceil(parent.length / 2);

            sortedIndexList[marker] = parent.slice(0, midpoint);              // Split the array in half, and put the left half into the marked index.
            totalBattles += sortedIndexList[marker].length;
            parentIndexList[marker] = i;                                      // Record where it came from.
            marker++;                                                         // Increment the marker to put the right half into.

            sortedIndexList[marker] = parent.slice(midpoint, parent.length);  // Put the right half next to its left half.
            totalBattles += sortedIndexList[marker].length;
            parentIndexList[marker] = i;                                      // Record where it came from.
            marker++;                                                         // Rinse and repeat, until we get arrays of length 1. This is initialization of merge sort.
        }
    }

    leftIndex = sortedIndexList.length - 2;    // Start with the second last value and...
    rightIndex = sortedIndexList.length - 1;    // the last value in the sorted list and work our way down to index 0.

    leftInnerIndex = 0;                        // Inner indexes, because we'll be comparing the left array
    rightInnerIndex = 0;                        // to the right array, in order to merge them into one sorted array.

    showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);
    document.querySelector('.progress-container').removeAttribute("hidden");
}

function progressBar(indicator, percentage) {
    document.querySelector('.progressbattle').innerHTML = indicator;
    document.querySelector('.progress-bar').style.width = `${percentage}%`;
}

function undo() {

    if (battleNo === 1) {
        return;
    }

    sortedIndexList = sortedIndexListPrev.slice(0);
    recordDataList = recordDataListPrev.slice(0);
    parentIndexList = parentIndexListPrev.slice(0);

    leftIndex = leftIndexPrev;
    leftInnerIndex = leftInnerIndexPrev;
    rightIndex = rightIndexPrev;
    rightInnerIndex = rightInnerIndexPrev;
    battleNo = battleNoPrev;
    sortedNo = sortedNoPrev;
    pointer = pointerPrev;

    autoSave();

    showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);
}

function result() {

    const elements = document.querySelectorAll('.music-card');
    elements.forEach(element => {
        element.style.display = 'none';
    });

    document.querySelector('.title').style.display = "block";
    document.querySelector('.title').style.height = "3%";
    document.querySelector('.title').textContent = "Make sure your sheet is sorted by ID before pasting!";

    let buttons = document.querySelectorAll('.basic-button');
    buttons.forEach(btn => btn.style.display = "none");

    let button1 = document.createElement("button");
    button1.classList.add("copy-button");
    button1.textContent = "Copy ranks to clipboard";
    button1.addEventListener("click", copyToClipboard);
    
    let button2 = document.createElement("button");
    button2.classList.add("copy-button");
    button2.textContent = "Copy sorted results";
    button2.addEventListener("click", copyResults);

    let container = document.querySelector(".button-container");
    container.appendChild(button1);
    container.appendChild(button2);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['ID', 'Anime', 'Song', 'Rank'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    musicData.forEach(music => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = music.id;
        tr.appendChild(tdId);

        const tdAnimeName = document.createElement('td');
        tdAnimeName.textContent = music.anime;
        tdAnimeName.title = music.anime;
        tr.appendChild(tdAnimeName);

        const tdMusicName = document.createElement('td');
        tdMusicName.textContent = music.name;
        tdMusicName.title = music.name;
        tr.appendChild(tdMusicName);

        const tdRank = document.createElement('td');
        tdRank.textContent = sortedIndexList[0].indexOf(music.id - 1) + 1;
        tr.appendChild(tdRank);

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    const duelContainer = document.querySelector('.duel-container');
    const tableContainer = document.createElement('div');
    tableContainer.className = "table-container";
    tableContainer.appendChild(table);
    duelContainer.appendChild(tableContainer);

}

function showSettings() {
    document.getElementById("settingsModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
}

function closeSettings() {
    document.getElementById("settingsModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
}

function selectOption(type, element) {
    let buttons = document.querySelectorAll(`.option-button[data-type='${type}']`);
    buttons.forEach(btn => btn.classList.remove("active"));
    element.classList.add("active");
    let text = element.textContent;

    if (text === 'Video') {
        video = true;
    } else if (text === 'Audio') {
        video = false;
    } else if (text === 'Europe') {
        region = "eu"
    } else if (text === 'NA West') {
        region = "naw";
    } else if (text === 'NA East') {
        region = "nae"
    }

    showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);

}

function copyToClipboard() {
    const ranksByID = [];
    musicData.forEach(music => {
        ranksByID.push(sortedIndexList[0].indexOf(music.id - 1) + 1);
    });
    const textToCopy = ranksByID.join("\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Copied ranks to clipboard!");
    }).catch(err => {
        console.error("Error copying ranks :", err);
    });
}

function copyResults() {
    const sortedResults = [];
    musicData.forEach(music => {
        sortedResults.push({
            id: music.id,
            anime: music.anime,
            name: music.name,
            rank: sortedIndexList[0].indexOf(music.id - 1) + 1
        });
    });

    sortedResults.sort((a, b) => a.rank - b.rank);

    const textToCopy = sortedResults.map(result => `${result.rank}. ${result.anime} - ${result.name}`).join("\n");
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Copied results to clipboard!");
    }).catch(err => {
        console.error("Error copying results :", err);
    });
}

function autoSave() {

    localStorage.setItem(`${config.localStoragePrefix}-sortedIndexList`, JSON.stringify(sortedIndexList));
    localStorage.setItem(`${config.localStoragePrefix}-recordDataList`, JSON.stringify(recordDataList));
    localStorage.setItem(`${config.localStoragePrefix}-parentIndexList`, JSON.stringify(parentIndexList));

    localStorage.setItem(`${config.localStoragePrefix}-leftIndex`, JSON.stringify(leftIndex));
    localStorage.setItem(`${config.localStoragePrefix}-leftInnerIndex`, JSON.stringify(leftInnerIndex));
    localStorage.setItem(`${config.localStoragePrefix}-rightIndex`, JSON.stringify(rightIndex));
    localStorage.setItem(`${config.localStoragePrefix}-rightInnerIndex`, JSON.stringify(rightInnerIndex));
    localStorage.setItem(`${config.localStoragePrefix}-battleNo`, JSON.stringify(battleNo));
    localStorage.setItem(`${config.localStoragePrefix}-sortedNo`, JSON.stringify(sortedNo));
    localStorage.setItem(`${config.localStoragePrefix}-pointer`, JSON.stringify(pointer));

    localStorage.setItem(`${config.localStoragePrefix}-sortedIndexListPrev`, JSON.stringify(sortedIndexListPrev));
    localStorage.setItem(`${config.localStoragePrefix}-recordDataListPrev`, JSON.stringify(recordDataListPrev));
    localStorage.setItem(`${config.localStoragePrefix}-parentIndexListPrev`, JSON.stringify(parentIndexListPrev));

    localStorage.setItem(`${config.localStoragePrefix}-leftIndexPrev`, JSON.stringify(leftIndexPrev));
    localStorage.setItem(`${config.localStoragePrefix}-leftInnerIndexPrev`, JSON.stringify(leftInnerIndexPrev));
    localStorage.setItem(`${config.localStoragePrefix}-rightIndexPrev`, JSON.stringify(rightIndexPrev));
    localStorage.setItem(`${config.localStoragePrefix}-rightInnerIndexPrev`, JSON.stringify(rightInnerIndexPrev));
    localStorage.setItem(`${config.localStoragePrefix}-battleNoPrev`, JSON.stringify(battleNoPrev));
    localStorage.setItem(`${config.localStoragePrefix}-sortedNoPrev`, JSON.stringify(sortedNoPrev));
    localStorage.setItem(`${config.localStoragePrefix}-pointerPrev`, JSON.stringify(pointerPrev));

    localStorage.setItem(`${config.localStoragePrefix}-totalBattles`, JSON.stringify(totalBattles));
}

function loadProgress() {
    battleNo = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-battleNo`));
    leftIndex = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-leftIndex`));
    if (battleNo == null) {
        alert("Can't find resources");
        battleNo = 1;
        return;
    }

    sortedIndexList = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-sortedIndexList`));
    recordDataList = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-recordDataList`));
    parentIndexList = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-parentIndexList`));

    leftInnerIndex = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-leftInnerIndex`));
    rightIndex = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-rightIndex`));
    rightInnerIndex = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-rightInnerIndex`));
    sortedNo = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-sortedNo`));
    pointer = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-pointer`));

    sortedIndexListPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-sortedIndexListPrev`));
    recordDataListPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-recordDataListPrev`));
    parentIndexListPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-parentIndexListPrev`));

    leftIndexPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-leftIndexPrev`));
    leftInnerIndexPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-leftInnerIndexPrev`));
    rightIndexPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-rightIndexPrev`));
    rightInnerIndexPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-rightInnerIndexPrev`));
    battleNoPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-battleNoPrev`));
    sortedNoPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-sortedNoPrev`));
    pointerPrev = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-pointerPrev`));

    totalBattles = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-totalBattles`));

    if (leftIndex == -1) {
        document.querySelector('.progress-container').removeAttribute("hidden");
        progressBar(`Completed! (${battleNo} battles)`, 100);
        result();
    } else {
        document.querySelector('.title').style.display = "none";
        document.getElementById("start").style.display = "none";
        document.getElementById("load").style.display = "none";

        let button1 = document.createElement("button");
        button1.classList.add("basic-button");
        button1.textContent = "Undo";
        button1.addEventListener("click", undo);

        let container = document.querySelector(".button-container");
        container.appendChild(button1);

        document.querySelector('.progress-container').removeAttribute("hidden");

        showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);
    }
}
