async function DownloadSong(btnElement, url, song_id) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Downloading...";
    btnElement.disabled = true;

    try {
        if (!results_objects[song_id] || !results_objects[song_id].track) {
            throw new Error("Track data not found");
        }
        const track = results_objects[song_id].track;
        const song_name = track.name;
        const artist_name = track.primaryArtists;

        // Fetch song data (AAC) directly
        const songResponse = await fetch(url);
        if (!songResponse.ok) throw new Error('Network response was not ok');
        const songBuffer = await songResponse.arrayBuffer();

        // Create Blob as audio/mp4 (AAC)
        const songBlob = new Blob([songBuffer], { type: 'audio/mp4' });
        const songUrl = URL.createObjectURL(songBlob);

        // Generate Filename: Artist - Song.m4a
        // Sanitize to safe characters
        let safe_artist = artist_name.replace(/[^a-zA-Z0-9 \-,&]/g, '').trim();
        let safe_song = song_name.replace(/[^a-zA-Z0-9 \-\(\)]/g, '').trim();
        // Fallback if empty
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
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    }
}
