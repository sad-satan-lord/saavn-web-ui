async function DownloadWithMetadata(btnElement, url, song_id) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "Converting...";
    btnElement.disabled = true;

    let songBuffer = null;
    let song_name = "song";

    try {
        if (!results_objects[song_id] || !results_objects[song_id].track) {
            throw new Error("Track data not found");
        }
        const track = results_objects[song_id].track;
        song_name = track.name;
        const artist_name = track.primaryArtists;
        const album_name = track.album.name;
        // Use high quality image
        const cover_url = (track.image && track.image.length > 2) ? track.image[2].link :
                          (track.image && track.image.length > 0) ? track.image[0].link : "";

        // Fetch song data (AAC)
        const songResponse = await fetch(url);
        if (!songResponse.ok) throw new Error('Network response was not ok');
        songBuffer = await songResponse.arrayBuffer();

        // Decode AAC to PCM
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(songBuffer.slice(0)); // slice to clone if needed, usually not

        // Convert PCM to MP3
        const mp3Blob = convertBufferToMp3(audioBuffer);
        const mp3Buffer = await mp3Blob.arrayBuffer();

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

        // Add ID3 tags
        const writer = new ID3Writer(mp3Buffer);
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

        const taggedSongBlob = writer.getBlob();
        const taggedSongUrl = URL.createObjectURL(taggedSongBlob);

        // Sanitize filename
        const safe_name = song_name.replace(/[^a-z0-9]/gi, '_');

        triggerDownload(taggedSongUrl, `${safe_name}.mp3`);
        URL.revokeObjectURL(taggedSongUrl);

    } catch (error) {
        console.error('Download/Conversion failed:', error);

        // Fallback to downloading the original AAC file if available
        if (songBuffer) {
            alert('Conversion failed. Downloading original file...');
            const safe_name = song_name.replace(/[^a-z0-9]/gi, '_');
            const songBlob = new Blob([songBuffer], { type: 'audio/mp4' });
            const songUrl = URL.createObjectURL(songBlob);
            triggerDownload(songUrl, `${safe_name}.m4a`);
            URL.revokeObjectURL(songUrl);
        } else {
            alert('Download failed. Opening direct link...');
            window.open(url);
        }
    } finally {
        if (btnElement) {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    }
}

function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function convertBufferToMp3(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const kbps = 192;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Data = [];

    const left = audioBuffer.getChannelData(0);
    const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

    const sampleBlockSize = 1152;
    for (let i = 0; i < left.length; i += sampleBlockSize) {
        const leftChunk = left.subarray(i, i + sampleBlockSize);
        let rightChunk;
        if (channels > 1) {
            rightChunk = right.subarray(i, i + sampleBlockSize);
        } else {
            rightChunk = leftChunk;
        }

        const leftInt16 = new Int16Array(leftChunk.length);
        const rightInt16 = new Int16Array(rightChunk.length);

        for (let j = 0; j < leftChunk.length; j++) {
            let val = leftChunk[j];
            val = val < -1 ? -1 : val > 1 ? 1 : val;
            leftInt16[j] = val < 0 ? val * 0x8000 : val * 0x7FFF;

            if (channels > 1) {
                let rVal = rightChunk[j];
                rVal = rVal < -1 ? -1 : rVal > 1 ? 1 : rVal;
                rightInt16[j] = rVal < 0 ? rVal * 0x8000 : rVal * 0x7FFF;
            } else {
                rightInt16[j] = leftInt16[j];
            }
        }

        const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
}
