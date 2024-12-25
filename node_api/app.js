const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.get('/download', (req, res) => {
    const trackUrl = req.query.url;
    const outputDir = path.join(__dirname, 'save');

    if (!trackUrl) {
        return res.status(400).json({ error: 'Please provide a Spotify track URL using the "url" query parameter.' });
    }

    const command = `/Users/abbasraza/Library/Caches/pypoetry/virtualenvs/spotdl-kLpyagoA-py3.13/bin/spotdl ${trackUrl} --output ${outputDir}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing spotDL: ${stderr}`);
            return res.status(500).json({ error: 'Failed to download the track.' });
        }

        console.log("stdout", stdout);

        // Check if the file already exists
        if (stdout.includes('(file already exists)')) {
            const trackNameMatch = stdout.match(/Skipping (.+?) \(file already exists\)/);
            if (trackNameMatch) {
                const trackName = trackNameMatch[1];
                const expectedFilePath = path.join(outputDir, `${trackName}.mp3`);
                const fileUrl = encodeURI(`http://localhost:${PORT}/files/${path.basename(expectedFilePath)}`);
                return res.json({ success: true, url: fileUrl });
            }
        }

        // Handle new downloads
        const downloadMatch = stdout.match(/Downloaded "(.+?)":/);
        if (downloadMatch) {
            const trackName = downloadMatch[1];
            const expectedFilePath = path.join(outputDir, `${trackName}.mp3`);
            const fileUrl = (`http://localhost:${PORT}/files/${path.basename(expectedFilePath)}`);
            return res.json({ success: true, url: fileUrl });
        }

        return res.status(500).json({ error: 'Failed to locate the downloaded file.' });
    });
});

app.use('/files', express.static(path.join(__dirname, 'save')));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});