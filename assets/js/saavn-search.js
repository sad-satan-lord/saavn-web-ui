// Global variables
const results_container = document.querySelector("#saavn-results");
let results_objects = {};
let lastSearch = ""; // Explicitly declare global state
const searchUrl = "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=";
let page_index = 1;

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Button setup
    const buttonTitles = ['2023','English Songs','Edward Maya','Zack Knight','Akcent','Arijit Singh','Enrique Iglesias','Pitbull','Imran Khan', 'DJ Snake', 'Darshan Raval', 'Jubin Nautiyal', 'Armaan Malik', 'Old Songs',"Adele","Billie Eilish","Imagine Dragons","Ed Sheeran","Neha Kakkar", "Badshah", "Atif Aslam", "Guru Randhawa", "Shreya Ghoshal", "Tony Kakkar", "Harrdy Sandhu", "Armaan Malik", "Diljit Dosanjh", "Sonu Nigam", "Vishal Dadlani", "Kanika Kapoor", "Sukhwinder Singh", "Sunidhi Chauhan", "Mika Singh", "Shaan", "Mohit Chauhan", "Pritam", "KK", "Yo Yo Honey Singh","Taylor Swift","Sia","Radioactive","Halsey","The Chainsmokers","Drake","Justin Bieber","Beyonce","The Weeknd","Rihanna","Lady Gaga","AC/DC","Michael Jackson","The Rolling Stones"];
    const buttonContainer = document.querySelector('.button-container');

    if (buttonContainer) {
        buttonTitles.forEach(title => {
            const button = document.createElement('button');
            button.classList.add('search-toggle');
            button.textContent = title;
            button.addEventListener('click', () => doSaavnSearch(title));
            buttonContainer.appendChild(button);
        });
    }
    
    // Search form
    const searchForm = document.getElementById('saavn-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            SaavnSearch();
        });
    }

    // Load More
    const loadMoreBtn = document.getElementById("loadmore");
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', nextPage);
    }

    // Hash change
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash && hash !== lastSearch) {
            doSaavnSearch(hash);
        }
    });

    // Initial load
    if (window.location.hash) {
        doSaavnSearch(window.location.hash.substring(1));
    } else {
        doSaavnSearch('english', 0, false);
    }

    // Bitrate change
    const bitrateSelect = document.getElementById('saavn-bitrate');
    if (bitrateSelect) {
        bitrateSelect.addEventListener('change', () => {
             if (lastSearch) doSaavnSearch(lastSearch);
        });
    }
});

function SaavnSearch() {
    const searchBox = document.querySelector("#saavn-search-box");
    let query = searchBox.value.trim();

    if (query.length > 0) {
        // Update hash, which triggers the search via listener
        window.location.hash = encodeURIComponent(query);
    }
}

function nextPage() {
    let query = document.querySelector("#saavn-search-box").value.trim();
    if (!query) {
        query = lastSearch;
    }
    doSaavnSearch(encodeURIComponent(query), 0, true);
}

async function doSaavnSearch(query, NotScroll, page) {
    if (!query) return;

    const cleanQuery = decodeURIComponent(query);
    lastSearch = cleanQuery;

    // Update UI
    document.querySelector("#saavn-search-box").value = cleanQuery;

    if (page_index === 1 && !page) {
        results_container.innerHTML = `<span class="loader">Searching...</span>`;
    }
    
    let apiQuery = encodeURIComponent(cleanQuery) + "&limit=40";
    if (page) {
        page_index++;
        apiQuery += "&page=" + page_index;
    } else {
        page_index = 1;
        apiQuery += "&page=1";
    }

    try {
        const response = await fetch(searchUrl + apiQuery);

        if (response.status !== 200) {
             const json = await response.json();
             results_container.innerHTML = `<div class="error">Error: ${json.message}</div>`;
             return;
        }

        const json = await response.json();
        const resultsData = json.data.results;

        if (!resultsData || resultsData.length === 0) {
            if (page_index === 1) {
                results_container.innerHTML = "<p> No result found. Try other Library </p>";
            }
            return;
        }

        if (page_index === 1) {
             results_objects = {};
        }

        const resultsHTML = [];

        for (let track of resultsData) {
            const song_id = track.id;
            const song_name = escapeHtml(TextAbstract(track.name, 25));
            let album_name = escapeHtml(TextAbstract(track.album.name, 20));
            if (track.album.name == track.name) {
                album_name = "";
            }

            const measuredTime = new Date(null);
            measuredTime.setSeconds(track.duration);
            let play_time = measuredTime.toISOString().substr(11, 8);
            if (play_time.startsWith("00:0")) play_time = play_time.slice(4);
            if (play_time.startsWith("00:")) play_time = play_time.slice(3);

            const year = escapeHtml(track.year.toString());
            const song_image = track.image[1].link;
            const song_artist = escapeHtml(TextAbstract(track.primaryArtists, 30));

            const bitrate = document.getElementById('saavn-bitrate');
            const bitrate_i = bitrate.options[bitrate.selectedIndex].value;

            if (track.downloadUrl) {
                const download_url = track.downloadUrl[bitrate_i]['link'];

                // Store in global object for PlayAudio/AddDownload to access
                results_objects[song_id] = { track: track };

                resultsHTML.push(`
                    <div class="text-left song-container" style="background-color: #1c1c1c; padding: 10px; border-radius: 10px;">
                        <div class="row" style="margin: auto;">
                            <div class="col-auto" style="padding: 0px;">
                                <img id="${song_id}-i" class="img-fluid d-inline" style="width: 115px; border-radius: 5px; height: 115px; padding-right: 10px;" src="${song_image}" loading="lazy"/>
                            </div>
                            <div class="col" style="padding: 2px;">
                                <p class="float-right fit-content" style="margin: 0px; color: #fff; padding-right: 10px;">${year}</p>
                                <p id="${song_id}-n" class="fit-content" style="margin: 0px; color: #fff; max-width: 100%;">${song_name}</p>
                                <p id="${song_id}-a" class="fit-content" style="margin: 0px; color: #fff; max-width: 100%;">${album_name}<br/></p>
                                <p id="${song_id}-ar" class="fit-content" style="margin: 0px; color: #fff; max-width: 100%;">${song_artist}<br/></p>

                                <button class="btn btn-primary song-btn play-btn" type="button" style="margin: 0px 2px;" data-id="${song_id}" data-url="${download_url}">▶</button>
                                <button class="btn btn-primary song-btn dl-btn" type="button" style="margin: 0px 2px;" data-id="${song_id}">DL</button>

                                <p class="float-right fit-content" style="margin: 0px; color: #fff; padding-right: 10px; padding-top: 15px;">${play_time}<br/></p>
                            </div>
                        </div>
                    </div>
                `);
            }
        }

        if (page_index > 1) {
            results_container.insertAdjacentHTML('beforeend', resultsHTML.join(''));
        } else {
            results_container.innerHTML = resultsHTML.join('');
        }

        if (!NotScroll) {
            document.getElementById("saavn-results").scrollIntoView({ behavior: 'smooth' });
        }

    } catch (error) {
        results_container.innerHTML = `<div class="error">Error: ${error} <br> Check if API is down </div>`;
        console.error(error);
    }
}

function TextAbstract(text, length) {
    if (text == null) {
        return "";
    }
    if (text.length <= length) {
        return text;
    }
    text = text.substring(0, length);
    const last = text.lastIndexOf(" ");
    if (last > 0) {
      text = text.substring(0, last);
    }
    return text + "...";
}

function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Event Delegation for Play and DL buttons
results_container.addEventListener('click', (e) => {
    if (e.target.classList.contains('play-btn')) {
        const id = e.target.getAttribute('data-id');
        const url = e.target.getAttribute('data-url');
        PlayAudio(url, id);
    } else if (e.target.classList.contains('dl-btn')) {
        const id = e.target.getAttribute('data-id');
        AddDownload(id);
    }
});
