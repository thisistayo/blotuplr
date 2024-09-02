const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const upload = multer({ dest: 'uploads/' });

const NFS_ROOT = '/Volumes/ccb-2t/images/blotpix'; // Update this to your NFS root path

app.use(express.static('public'));
app.use(express.json());

// Endpoint to get existing themes
app.get('/api/themes', async (req, res) => {
  try {
    const themes = await getThemes(NFS_ROOT);
    res.json(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const theme = req.body.theme;
    
    // Check if the theme exists
    const themeDir = path.join(NFS_ROOT, theme);
    try {
      await fs.access(themeDir);
    } catch (error) {
      // Theme doesn't exist
      await fs.unlink(req.file.path); // Delete the uploaded file
      return res.status(400).json({ error: 'Theme does not exist. Please choose an existing theme.' });
    }

    // Resize image
    const resizedImage = await sharp(req.file.path)
      .resize(1920, 1920, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();

    // Save the resized image
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(themeDir, fileName);
    await fs.writeFile(filePath, resizedImage);

    // Delete the original uploaded file
    await fs.unlink(req.file.path);

    res.json({ message: 'File uploaded successfully!', filePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during upload.' });
  }
});

async function getThemes(dir, baseDir = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let themes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(baseDir, entry.name);
      themes.push(fullPath);
      
      // Recursively get subthemes
      const subThemes = await getThemes(path.join(dir, entry.name), fullPath);
      themes = themes.concat(subThemes);
    }
  }

  return themes;
}

// Serve the Vue app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});