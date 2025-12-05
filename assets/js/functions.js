// Global variables
const DOWNLOAD_API = "https://openmp3compiler.astudy.org";

// Modal Popup Logic
document.addEventListener('DOMContentLoaded', () => {
    const mpopup = document.getElementById('mpopupBox');
    const mpLink = document.getElementById("mpopupLink");
    const close = document.getElementsByClassName("close")[0];

    if (mpLink) {
        mpLink.onclick = function() {
            mpopup.style.display = "block";
        };
    }

    if (close) {
        close.onclick = function() {
            mpopup.style.display = "none";
        };
    }

    window.onclick = function(event) {
        if (event.target == mpopup) {
            mpopup.style.display = "none";
        }
    };
});

function PlayAudio(audio_url, song_id) {
    const audio = document.getElementById('player');
    const source = document.getElementById('audioSource');
    source.src = audio_url;
    
    // In the new logic, we might need a better way to get these if ids are removed.
    // However, for now, we'll keep the ID logic but ensure elements exist.
    const nameEl = document.getElementById(song_id + "-n");
    const albumEl = document.getElementById(song_id + "-a");
    const imageEl = document.getElementById(song_id + "-i");
    
    if (!nameEl || !albumEl || !imageEl) {
        console.error("Song elements not found for ID:", song_id);
        return;
    }

    const name = nameEl.textContent;
    const album = albumEl.textContent;
    const image = imageEl.getAttribute("src");

    document.title = name + " - " + album;
    
    const bitrate = document.getElementById('saavn-bitrate');
    // Not using bitrate value for quality variable as it was unused in original code
    // var bitrate_i = bitrate.options[bitrate.selectedIndex].value;

    document.getElementById("player-name").textContent = name;
    document.getElementById("player-album").textContent = album;
    document.getElementById("player-image").setAttribute("src", image);

    const promise = audio.load();
    if (promise) {
        promise.catch(error => console.error(error));
    }
    audio.play();
}

function AddDownload(id) {
    const MP3DL = `${DOWNLOAD_API}/add?id=${id}`;

    fetch(MP3DL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status == "success") {
                const download_list = document.getElementById("download-list");
                const download_item = document.createElement("li");

                download_item.innerHTML = `
                <div class="col">
                    <img class="track-img" src="${data.image}" width="50px">
                    <div style="display: inline;">
                        <span class="track-name">${id}</span> -
                        <span class="track-album">${data.album}</span>
                        <br>
                        <span class="track-size">Size : Null</span>
                        <span class="track-status" style="color:green"></span>
                    </div>
                </div>
                <hr>
                `;

                download_item.setAttribute("track_tag", id);
                download_item.className = "no-bullets";
                download_list.appendChild(download_item);

                const STATUS_URL = `${DOWNLOAD_API}/status?id=${id}`;
                const download_status_span = document.querySelector(`[track_tag="${id}"] .track-status`);
                const download_name = document.querySelector(`[track_tag="${id}"] .track-name`);
                const download_album = document.querySelector(`[track_tag="${id}"] .track-album`);
                const download_img = document.querySelector(`[track_tag="${id}"] .track-img`);
                const download_size = document.querySelector(`[track_tag="${id}"] .track-size`);

                // Access global results_objects safely
                if (typeof results_objects !== 'undefined' && results_objects[id]) {
                    download_name.textContent = results_objects[id].track.name;
                    download_album.textContent = results_objects[id].track.album.name;
                    download_img.setAttribute("src", results_objects[id].track.image[2].link);
                }

                download_status_span.textContent = data.status;

                const float_tap = document.getElementById('mpopupLink');
                if (float_tap) {
                    float_tap.style.backgroundColor = "green";
                    float_tap.style.borderColor = "green";
                    setTimeout(() => {
                        float_tap.style.backgroundColor = "transparent";
                        float_tap.style.borderColor = "transparent";
                    }, 1000);
                }

                const interval = setInterval(() => {
                    fetch(STATUS_URL)
                        .then(response => response.json())
                        .then(data => {
                            if (data.status) {
                                download_status_span.textContent = data.status;
                                if (data.size) {
                                    download_size.textContent = "Size: " + data.size;
                                }
                                if (data.status == "Done") {
                                    download_status_span.innerHTML = `<a href="${DOWNLOAD_API}${data.url}" target="_blank">Download MP3</a>`;
                                    clearInterval(interval);
                                }
                            }
                        })
                        .catch(err => {
                            console.error("Status check failed", err);
                            clearInterval(interval);
                        });
                }, 3000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Download failed: The download server is currently unavailable. Please check the API configuration.");
        });
}
