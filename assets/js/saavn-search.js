var results_container = document.querySelector("#saavn-results")
var results_objects = {};
var lastSearch = "";
const searchUrl = "https://saavnapi-nine.vercel.app/result/?query=";

function SaavnSearch() {
    event.preventDefault(); // stop page changing to #, which will reload the page
    var query = document.querySelector("#saavn-search-box").value.trim()
    query = encodeURIComponent(query);

    if (query == lastSearch) { doSaavnSearch(query) }
    window.location.hash = lastSearch;
    if (query.length > 0) {
        window.location.hash = query
    }

}
var page_index = 1;
function nextPage() {
    var query = document.querySelector("#saavn-search-box").value.trim();
    if (!query) { query = lastSearch; }
    query = encodeURIComponent(query);
    // The new API doesn't seem to support pagination in the same way (or at all based on initial check),
    // but we'll leave this structure or attempt to use &page= if the API supports it.
    // The previous analysis didn't explicitly see pagination support in the 'universal' endpoint.
    // However, keeping the logic for now doesn't hurt if we just append it, though it might be ignored.
    doSaavnSearch(query, 0, true)
}

async function doSaavnSearch(query, NotScroll, page) {
    window.location.hash = query;
    document.querySelector("#saavn-search-box").value = decodeURIComponent(query);
    if (!query) { return 0; }
    results_container.innerHTML = `<div class="text-center"><div class="loader"></div><p style="margin-top: 10px;">Searching...</p></div>`;
    
    // The new API endpoint structure: /result/?query=<query>&lyrics=true
    // It does not seem to support 'limit' or 'page' in the universal endpoint based on the README,
    // but usually these APIs might just ignore extra params.
    // We will construct the URL as per the new API.

    let fetchUrl = searchUrl + query;

    // try catch
    try {
        var response = await fetch(fetchUrl);
    } catch (error) {
        results_container.innerHTML = `<span class="error">Error: ${error} <br> Check if API is down </span>`;
        return;
    }

    /* If response code isn't 200, display error*/
    if (response.status !== 200) {
        results_container.innerHTML = `<span class="error">Error: Status Code ${response.status}</span>`;
        console.log(response)
        return 0;
    }

    var json = await response.json();

    // The new API returns the list directly.
    var results = [];
    if (!json || json.length === 0) {
        results_container.innerHTML = "<p> No result found. Try other Library </p>";
        return;
    }

    lastSearch = decodeURI(window.location.hash.substring(1));

    for (let track of json) {
        // Map new API fields
        let song_name_text = track.song;
        let album_name_text = track.album;
        let song_artist_text = track.primary_artists;
        let song_image = track.image; // This is a string URL
        let download_url = track.media_url;
        let year = track.year;
        let song_id = track.id;
        let duration = track.duration; // seconds

        // Text Abstract
        let display_song_name = TextAbstract(song_name_text, 25);
        let display_album_name = TextAbstract(album_name_text, 20);
        let display_song_artist = TextAbstract(song_artist_text, 30);

        if (album_name_text == song_name_text) {
            display_album_name = ""
        }

        var measuredTime = new Date(null);
        measuredTime.setSeconds(duration); // specify value of SECONDS
        var play_time = measuredTime.toISOString().substr(11, 8);
        if (play_time.startsWith("00:0")) {
            play_time = play_time.slice(4);
        }
        if (play_time.startsWith("00:")) {
            play_time = play_time.slice(3);
        }

        if (download_url) {
            // push object to results array
            results_objects[song_id] = {
                track: track
            };
            results.push(`
      <div class="text-left song-container">
        <div class="row" style="margin:auto;">
            <div class="col-auto" style="padding:0px;border-style:none;">
                <img id="${song_id}-i" class="img-fluid d-inline" style="width:115px;border-radius:10px;height:115px;" src="${song_image}" loading="lazy"/>
            </div>
            <div class="col song-info-col">
                <div class="song-meta-row">
                    <div id="${song_id}-n" class="song-title" title="${song_name_text}">${display_song_name}</div>
                    <div style="font-size:0.8em; opacity:0.7;">${year}</div>
                </div>
                <div id="${song_id}-ar" class="song-artist" title="${song_artist_text}">${display_song_artist}</div>
                <div id="${song_id}-a" class="song-album" title="${album_name_text}">${display_album_name}</div>

                <div class="song-actions-row">
                    <div>
                        <button class="btn btn-primary song-btn" type="button" onclick='PlayAudio("${download_url}","${song_id}")'><i class="fas fa-play"></i></button>
                        <button class="btn btn-primary song-btn" type="button" style="margin-left: 10px;" onclick='DownloadSong(this, "${download_url}","${song_id}")'><i class="fas fa-download"></i></button>
                    </div>
                    <div style="font-size:0.9em; opacity:0.8;">${play_time}</div>
                </div>
            </div>
        </div>
      </div>
`
            );
        }
    }

    results_container.innerHTML = results.join(' ');
    if (!NotScroll) {
        document.getElementById("saavn-results").scrollIntoView();
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
    last = text.lastIndexOf(" ");
    text = text.substring(0, last);
    return text + "...";
}

if (window.location.hash) {
    doSaavnSearch(window.location.hash.substring(1));
} else { doSaavnSearch('english', 1); }

addEventListener('hashchange', event => { });
onhashchange = event => { doSaavnSearch(window.location.hash.substring(1)) };

// If Bitrate changes, search again (This is largely irrelevant now as we use the single URL provided by the new API, but kept for UI consistency if the selector remains)
$('#saavn-bitrate').on('change', function () {
    doSaavnSearch(lastSearch);
});
document.getElementById("loadmore").addEventListener('click', nextPage)
