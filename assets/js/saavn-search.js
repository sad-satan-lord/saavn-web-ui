var results_container = document.querySelector("#saavn-results")
var results_objects = {};
var lastSearch = "";
const searchUrl = "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=";
function SaavnSearch() {
event.preventDefault(); // stop page changing to #, which will reload the page
var query = document.querySelector("#saavn-search-box").value.trim()
query = encodeURIComponent(query);

if(query==lastSearch) {doSaavnSearch(query)}
    window.location.hash = lastSearch; 
if(query.length > 0) { 
    window.location.hash = query 
}

}
var page_index = 1;
function nextPage() {
    var query = document.querySelector("#saavn-search-box").value.trim();
    if (!query) {query = lastSearch;}
    query = encodeURIComponent(query);
    doSaavnSearch(query,0,true)
}
async function doSaavnSearch(query,NotScroll,page) {
    window.location.hash = query;
    document.querySelector("#saavn-search-box").value = decodeURIComponent(query);
    if(!query) {return 0;}
    results_container.innerHTML = `<div class="text-center"><div class="loader"></div><p style="margin-top: 10px;">Searching...</p></div>`;
    query=query+"&limit=40";
    if(page) {
        ;page_index=page_index+1;query=query+"&page="+page_index;
    } else {query=query+"&page=1";page_index=1;}
    
// try catch
try {
var response = await fetch(searchUrl + query);
} catch(error) {
results_container.innerHTML = `<span class="error">Error: ${error} <br> Check if API is down </span>`;
}
var json = await response.json();
/* If response code isn't 200, display error*/
if (response.status !== 200) {
    results_container.innerHTML = `<span class="error">Error: ${json.message}</span>`;
    console.log(response)
    return 0;
}
var json = json.data.results;
var results = [];
if(!json) {results_container.innerHTML = "<p> No result found. Try other Library </p>";return;}
lastSearch = decodeURI(window.location.hash.substring(1));
for(let track of json) {


song_name = TextAbstract(track.name,25);
album_name = TextAbstract(track.album.name,20);
if (track.album.name == track.name) {
    album_name = ""
}
var measuredTime = new Date(null);
measuredTime.setSeconds(track.duration); // specify value of SECONDS
var play_time = measuredTime.toISOString().substr(11, 8);
if (play_time.startsWith("00:0")) {
    play_time = play_time.slice(4);
}
if (play_time.startsWith("00:")) {
    play_time = play_time.slice(3);
}
var song_id = track.id;
var year = track.year;
var song_image = track.image[1].link;
var song_artist = TextAbstract(track.primaryArtists,30);
var bitrate = document.getElementById('saavn-bitrate');
var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
if(track.downloadUrl) {
var download_url = track.downloadUrl[bitrate_i]['link'];
var quality = "";
if (bitrate_i == 4) {quality = 320} else {quality = 160;}
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
                    <div id="${song_id}-n" class="song-title" title="${track.name}">${song_name}</div>
                    <div style="font-size:0.8em; opacity:0.7;">${year}</div>
                </div>
                <div id="${song_id}-ar" class="song-artist" title="${track.primaryArtists}">${song_artist}</div>
                <div id="${song_id}-a" class="song-album" title="${track.album.name}">${album_name}</div>

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
); }
    }
    
    results_container.innerHTML = results.join(' ');
    if(!NotScroll){
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
if(window.location.hash) {
   doSaavnSearch(window.location.hash.substring(1));
} else {doSaavnSearch('english',1);}

addEventListener('hashchange', event => { });
onhashchange = event => {doSaavnSearch(window.location.hash.substring(1))};

// If Bitrate changes, search again
$('#saavn-bitrate').on('change', function () {
    doSaavnSearch(lastSearch);
        /*
    var isDirty = !this.options[this.selectedIndex].defaultSelected;

    if (isDirty) {
        // Value Changed
        doSaavnSearch(lastSearch)
    } else {
        // Do Nothing
    } */
});
document.getElementById("loadmore").addEventListener('click',nextPage)
