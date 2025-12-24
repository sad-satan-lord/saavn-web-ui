async function DownloadWithMetadata(btnElement, url, song_id) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Downloading...";
    btnElement.disabled = true;

    try {
        // Fetch song data
        const songResponse = await fetch(url);
        if (!songResponse.ok) throw new Error('Network response was not ok');
        const songBuffer = await songResponse.arrayBuffer();

        // Create blob
        const songBlob = new Blob([songBuffer], { type: 'audio/mp4' });
        const songUrl = URL.createObjectURL(songBlob);

        // Get filename
        let filename = "song.m4a";
        if (results_objects[song_id] && results_objects[song_id].track) {
            const track = results_objects[song_id].track;
            // Sanitize filename
            const name = track.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            filename = `${name}.m4a`;
        }

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
