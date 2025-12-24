async function DownloadWithMetadata(btnElement, url, song_id) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Downloading...";
    btnElement.disabled = true;

    try {
        // Extract metadata safely inside try block
        if (!results_objects[song_id] || !results_objects[song_id].track) {
            throw new Error("Track data not found");
        }
        const track = results_objects[song_id].track;
        const song_name = track.name;
        const artist_name = track.primaryArtists;
        const album_name = track.album.name;
        // Use high quality image if available, fall back to what's available
        const cover_url = (track.image && track.image.length > 2) ? track.image[2].link :
                          (track.image && track.image.length > 0) ? track.image[0].link : "";

        // Fetch song data
        const songResponse = await fetch(url);
        if (!songResponse.ok) throw new Error('Network response was not ok');
        const songBuffer = await songResponse.arrayBuffer();

        // Fetch cover image
        let coverBuffer = null;
        if (cover_url) {
            try {
                const coverResponse = await fetch(cover_url);
                if (coverResponse.ok) {
                    coverBuffer = await coverResponse.arrayBuffer();
                }
            } catch (e) {
                console.warn("Failed to fetch cover image", e);
            }
        }

        // Add metadata
        const writer = new ID3Writer(songBuffer);
        writer.setFrame('TIT2', song_name)
              .setFrame('TPE1', [artist_name])
              .setFrame('TALB', album_name);

        if (coverBuffer) {
            writer.setFrame('APIC', {
                  type: 3,
                  data: coverBuffer,
                  description: 'Cover',
                  useUnicodeEncoding: false
              });
        }
        writer.addTag();

        const taggedSongBuffer = writer.getBlob();
        const taggedSongUrl = URL.createObjectURL(taggedSongBuffer);

        // Trigger download
        const a = document.createElement('a');
        a.href = taggedSongUrl;
        a.download = `${song_name}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(taggedSongUrl);

    } catch (error) {
        console.error('Download with metadata failed:', error);
        alert('Download with metadata failed. Starting direct download...');
        window.open(url);
    } finally {
        if (btnElement) {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    }
}
