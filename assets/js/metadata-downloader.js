async function DownloadSong(btnElement, url, song_id) {
    const originalContent = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btnElement.disabled = true;

    try {
        if (!results_objects[song_id] || !results_objects[song_id].track) {
            throw new Error("Track data not found");
        }
        const track = results_objects[song_id].track;
        const song_name = track.song;
        const artist_name = track.primary_artists;

        // Fetch song data (AAC) directly
        const songResponse = await fetch(url);
        if (!songResponse.ok) throw new Error('Network response was not ok');
        const songBuffer = await songResponse.arrayBuffer();

        // Create Blob as audio/mp4 (AAC)
        const songBlob = new Blob([songBuffer], { type: 'audio/mp4' });
        const songUrl = URL.createObjectURL(songBlob);

        // Generate Filename: Artist - Song.m4a
        // Use a more robust sanitization, but fallback to "Song" if empty
        let safe_artist = "";
        if (artist_name) {
             safe_artist = artist_name.replace(/[^a-zA-Z0-9 \-\(\)\.,&]/g, '').trim();
        }

        let safe_song = "";
        if (song_name) {
            safe_song = song_name.replace(/[^a-zA-Z0-9 \-\(\)\.,&]/g, '').trim();
        }

        if (!safe_song) safe_song = "Song";
        if (!safe_artist) safe_artist = "Artist";

        const filename = `${safe_artist} - ${safe_song}.m4a`;

        // Trigger download
        const a = document.createElement('a');
        a.href = songUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(songUrl);

    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Opening direct link...');
        window.open(url);
    } finally {
        if (btnElement) {
            btnElement.innerHTML = originalContent;
            btnElement.disabled = false;
        }
    }
}
