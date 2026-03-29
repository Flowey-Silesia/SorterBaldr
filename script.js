// script.js - Versión corregida
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

let mediaFormat = "video";
let region = "eu";

fetch('songList.json')
    .then(response => response.json())
    .then(data => {
        musicData = data;
    })
    .catch(error => {
        console.error("Error loading JSON:", error);
    });

// ESPERAR A QUE TODO CARGUE
document.addEventListener("DOMContentLoaded", function() {
    document.title = config.title;
    document.querySelector('meta[name="og:site_name"]').setAttribute("content", config.title);
    document.querySelector('meta[name="og:description"]').setAttribute("content", config.description);
    
    // Configurar auth solo si existe
    if (typeof setupAuthModal !== 'undefined') {
        try {
            setupAuthModal();
        } catch(e) {
            console.log("Auth not available");
        }
    }
});

function configureLoadButton() {
    let loadButton = document.getElementById("load");
    let title = document.querySelector('.title');
    
    // Leer el estado actual de localStorage
    let battleNoLocal = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-battleNo`));
    let leftIndexLocal = JSON.parse(localStorage.getItem(`${config.localStoragePrefix}-leftIndex`));
    
    const user = (typeof getCurrentUser !== 'undefined') ? getCurrentUser() : null;
    const buttonContainer = document.querySelector('.button-container');
    
    // Eliminar botones viejos de auth para evitar duplicados
    const oldCloudLoadBtn = document.getElementById('cloudLoadBtn');
    const oldLoginBtn = document.getElementById('cloudLoginBtn');
    const oldUserDisplay = document.getElementById('userDisplay');
    
    if (oldCloudLoadBtn) oldCloudLoadBtn.remove();
    if (oldLoginBtn) oldLoginBtn.remove();
    if (oldUserDisplay) oldUserDisplay.remove();
    
    if (user) {
        let cloudLoadBtn = document.createElement('button');
        cloudLoadBtn.id = 'cloudLoadBtn';
        cloudLoadBtn.className = 'basic-button';
        cloudLoadBtn.textContent = '☁️ Load Cloud';
        cloudLoadBtn.style.backgroundColor = '#2d6a4f';
        cloudLoadBtn.onclick = loadFromCloud;
        buttonContainer.appendChild(cloudLoadBtn);
        
        let userDisplay = document.createElement('div');
        userDisplay.id = 'userDisplay';
        userDisplay.className = 'user-display';
        userDisplay.innerHTML = `✅ ${user.username} | <span onclick="logout()" style="cursor:pointer; color:#ff9999;">Logout</span>`;
        buttonContainer.appendChild(userDisplay);
    } else {
        let loginBtn = document.createElement('button');
        loginBtn.id = 'cloudLoginBtn';
        loginBtn.className = 'basic-button';
        loginBtn.textContent = '☁️ Login';
        loginBtn.style.backgroundColor = '#1e3a8a';
        loginBtn.onclick = showAuthModal;
        buttonContainer.appendChild(loginBtn);
    }
    
    // 🔹 CONFIGURAR BOTÓN LOAD SEGÚN EL ESTADO ACTUAL 🔹
    if (battleNoLocal == null) {
        // No hay datos guardados
        loadButton.hidden = true;
        title.textContent = 'Press "Start" to begin sorting.';
    } else {
        loadButton.hidden = false;
        if (leftIndexLocal == -1) {
            // El ranking ya está completado (leftIndex = -1)
            loadButton.textContent = "Show Results";
            title.textContent = 'Press "Start" to begin sorting or "Show Results" to display results of previous sorting.';
        } else {
            // Hay progreso guardado
            loadButton.textContent = "Continue";
            title.textContent = 'Press "Start" to begin sorting or "Continue" to load saved progress and resume where you left.';
        }
    }
}

// Función para guardar en cloud
async function saveToCloud() {
    if (typeof getCurrentUser === 'undefined' || !getCurrentUser()) {
        if (typeof showAuthModal !== 'undefined') {
            showAuthModal();
        }
        return;
    }
    
    if (typeof saveRankingData === 'undefined') {
        alert("Cloud save not configured");
        return;
    }
    
    const rankingData = {
        sortedIndexList,
        recordDataList,
        parentIndexList,
        leftIndex,
        leftInnerIndex,
        rightIndex,
        rightInnerIndex,
        battleNo,
        sortedNo,
        pointer,
        totalBattles
    };
    
    const result = await saveRankingData(rankingData);
    if (result.success) {
        alert("Data saved to cloud!");
    } else {
        alert("Error saving: " + result.error);
    }
}

// Función para cargar datos desde la nube de Supabase
async function loadFromCloud() {
    // Verificar si hay usuario logueado
    if (typeof getCurrentUser === 'undefined' || !getCurrentUser()) {
        alert("Please login first. Click the Login button.");
        if (typeof showAuthModal !== 'undefined') {
            showAuthModal();
        }
        return;
    }
    
    if (typeof loadRankingData === 'undefined') {
        alert("Cloud feature not available");
        return;
    }
    
    alert("Loading data from cloud for user: " + getCurrentUser().username);
    
    const result = await loadRankingData();
    
    if (result.success) {
        // Cargar los datos en las variables globales
        sortedIndexList = result.data.sortedIndexList;
        recordDataList = result.data.recordDataList;
        parentIndexList = result.data.parentIndexList;
        leftIndex = result.data.leftIndex;
        leftInnerIndex = result.data.leftInnerIndex;
        rightIndex = result.data.rightIndex;
        rightInnerIndex = result.data.rightInnerIndex;
        battleNo = result.data.battleNo;
        sortedNo = result.data.sortedNo;
        pointer = result.data.pointer;
        totalBattles = result.data.totalBattles;
        
        // Guardar también en localStorage para respaldo
        autoSave();
        
        alert(`Data loaded! Battle ${battleNo} of ${totalBattles}`);
        
        // Mostrar la batalla actual
        if (leftIndex == -1) {
            document.querySelector('.progress-container').removeAttribute("hidden");
            progressBar(`Completed! (${battleNo} battles)`, 100);
            result();
        } else {
            document.querySelector('.title').style.display = "none";
            document.getElementById("start").style.display = "none";
            document.getElementById("load").style.display = "none";
            
            // Verificar si ya existe el botón Undo
            if (!document.querySelector('.basic-button[onclick="undo()"]')) {
                let button1 = document.createElement("button");
                button1.classList.add("basic-button");
                button1.textContent = "Undo";
                button1.addEventListener("click", undo);
                let container = document.querySelector(".button-container");
                container.appendChild(button1);
            }
            
            document.querySelector('.progress-container').removeAttribute("hidden");
            showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);
        }
    } else {
        alert("Error loading from cloud: " + result.error + "\n\nMake sure you have saved data first. Play some battles and the data will auto-save to cloud.");
    }
}

// Modificar autoSave para que no falle
function autoSave() {
    // Guardar en localStorage siempre
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
    localStorage.setItem(`${config.localStoragePrefix}-totalBattles`, JSON.stringify(totalBattles));
    
    // Guardar en cloud solo si las funciones existen
    if (typeof getCurrentUser !== 'undefined' && getCurrentUser() && typeof saveRankingData !== 'undefined') {
        const rankingData = {
            sortedIndexList,
            recordDataList,
            parentIndexList,
            leftIndex,
            leftInnerIndex,
            rightIndex,
            rightInnerIndex,
            battleNo,
            sortedNo,
            pointer,
            totalBattles
        };
        saveRankingData(rankingData).catch(err => console.log("Cloud save:", err));
    }
}

// El resto de tus funciones (showDuel, pick, start, undo, result, etc.) van aquí
// ... mantén todas tus funciones originales ...

function showDuel(id1, id2) {
    const duelContainer = document.getElementById('duel');
    duelContainer.innerHTML = "";

    function createMusicCard(music, isLeft) {
        const card = document.createElement('div');
        card.className = 'music-card';

        let mediaElement = null;

        // Sistema de fallback según el formato seleccionado
        if (mediaFormat === "video") {
            // Intentar: Video local -> YouTube -> Audio
            if (music.video) {
                mediaElement = createVideoElement(music);
            }
            
            if (!mediaElement && music.youtube) {
                mediaElement = createYouTubeElement(music);
            }
            
            if (!mediaElement && music.mp3) {
                mediaElement = createAudioElement(music);
            }
        } 
        else if (mediaFormat === "youtube") {
            // Intentar: YouTube -> Video local -> Audio
            if (music.youtube) {
                mediaElement = createYouTubeElement(music);
            }
            
            if (!mediaElement && music.video) {
                mediaElement = createVideoElement(music);
            }
            
            if (!mediaElement && music.mp3) {
                mediaElement = createAudioElement(music);
            }
        } 
        else if (mediaFormat === "audio") {
            // Intentar: Audio -> YouTube -> Video local
            if (music.mp3) {
                mediaElement = createAudioElement(music);
            }
            
            if (!mediaElement && music.youtube) {
                mediaElement = createYouTubeElement(music);
            }
            
            if (!mediaElement && music.video) {
                mediaElement = createVideoElement(music);
            }
        }

        // Si aún no hay ningún medio disponible
        if (!mediaElement) {
            mediaElement = `<div class="no-media">No hay contenido multimedia disponible para esta canción</div>`;
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

    // Función auxiliar para crear elemento de video local
    function createVideoElement(music) {
        try {
            if (music.video.includes("youtube.com")) {
                const videoId = new URL(music.video).searchParams.get("v");
                return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            } else if (music.video.endsWith(".webm") || music.video.endsWith(".mp4")) {
                if (music.video.includes("animemusicquiz")) {
                    return `<video controls><source src="https://${region}dist.animemusicquiz.com/${music.video.split('/').pop()}" type="video/webm"></video>`;
                } else {
                    return `<video controls><source src="${music.video}" type="video/webm"></video>`;
                }
            }
        } catch (e) {
            console.warn("Error al procesar video:", e);
        }
        return null;
    }

    // Función auxiliar para crear elemento de YouTube
    function createYouTubeElement(music) {
        try {
            let videoId = music.youtube;
            // Si la URL es completa, extraer el ID
            if (music.youtube.includes("youtube.com") || music.youtube.includes("youtu.be")) {
                if (music.youtube.includes("youtube.com/watch?v=")) {
                    videoId = new URL(music.youtube).searchParams.get("v");
                } else if (music.youtube.includes("youtu.be/")) {
                    videoId = music.youtube.split("/").pop();
                }
            }
            return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        } catch (e) {
            console.warn("Error al procesar YouTube:", e);
        }
        return null;
    }

    // Función auxiliar para crear elemento de audio
    function createAudioElement(music) {
        try {
            if (music.mp3.includes("animemusicquiz")) {
                return `<audio controls><source src="https://${region}dist.animemusicquiz.com/${music.mp3.split('/').pop()}" type="audio/mp3"></audio>`;
            } else {
                return `<audio controls><source src="${music.mp3}" type="audio/mp3"></audio>`;
            }
        } catch (e) {
            console.warn("Error al procesar audio:", e);
        }
        return null;
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
        
        // 🔹 GUARDAR EN NUBE AL TERMINAR 🔹
        if (typeof getCurrentUser !== 'undefined' && getCurrentUser() && typeof saveRankingData !== 'undefined') {
            const rankingData = {
                sortedIndexList,
                recordDataList,
                parentIndexList,
                leftIndex,
                leftInnerIndex,
                rightIndex,
                rightInnerIndex,
                battleNo,
                sortedNo,
                pointer,
                totalBattles
            };
            saveRankingData(rankingData).then(result => {
                if (result.success) console.log("Final data saved to cloud");
                else console.log("Cloud save failed:", result.error);
            });
        }
        configureLoadButton();
        result();
    } else {
        battleNo++;
        autoSave();
        
        // 🔹 GUARDAR EN NUBE DESPUÉS DE CADA BATALLA 🔹
        if (typeof getCurrentUser !== 'undefined' && getCurrentUser() && typeof saveRankingData !== 'undefined') {
            const rankingData = {
                sortedIndexList,
                recordDataList,
                parentIndexList,
                leftIndex,
                leftInnerIndex,
                rightIndex,
                rightInnerIndex,
                battleNo,
                sortedNo,
                pointer,
                totalBattles
            };
            saveRankingData(rankingData).catch(err => console.log("Cloud save error:", err));
        }
        
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
        configureLoadButton();
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
        configureLoadButton();

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

    if (type === 'format') {
        if (text === 'Video') {
            mediaFormat = "video";
        } else if (text === 'Audio') {
            mediaFormat = "audio";
        } else if (text === 'YouTube') {
            mediaFormat = "youtube";
        }
    } else if (type === 'region') {
        if (text === 'Europe') {
            region = "eu";
        } else if (text === 'NA West') {
            region = "naw";
        } else if (text === 'NA East') {
            region = "nae";
        }
    }

    // Actualizar la vista si hay una batalla en curso
    if (sortedIndexList && sortedIndexList.length > 0 && leftIndex !== undefined) {
        showDuel(sortedIndexList[leftIndex][leftInnerIndex], sortedIndexList[rightIndex][rightInnerIndex]);
    }
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
 document.addEventListener("DOMContentLoaded", function() {
    document.title = config.title;
    document.querySelector('meta[name="og:site_name"]')?.setAttribute("content", config.title);
    document.querySelector('meta[name="og:description"]')?.setAttribute("content", config.description);
    
    // Configurar auth modal si existe
    if (typeof setupAuthModal !== 'undefined') {
        setupAuthModal();
    }
    
    configureLoadButton();
 });   
}
