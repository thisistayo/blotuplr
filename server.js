const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');
const path = require('path');
const sharp = require('sharp'); // Import sharp for image processing

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Setup MinIO client
const minioClient = new Minio.Client({
    endPoint: 'objects.hbvu.su',
    port: 443,
    useSSL: true,
    accessKey: 'lucarv',
    secretKey: 'lucaPWD$MinI0'
});

// Store buckets in memory
let bucketsList = [];

// Function to fetch buckets from MinIO
const fetchBuckets = async () => {
    try {
        bucketsList = await minioClient.listBuckets();
        const bucketNames = bucketsList.map(bucket => bucket.name);
        console.log('Bucket names:', bucketNames);
    } catch (err) {
        console.error('Error fetching buckets:', err);
    }
};

// Call the function to fetch buckets on server start
fetchBuckets();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on GET request to '/'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get the list of buckets
app.get('/buckets', (req, res) => {
    res.json(bucketsList);
});

// Endpoint to upload files with resizing
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    console.log(req.body); // Log the entire body for debugging
    const bucketName = req.body.bucketName;
    const folderPath = req.body.folderPath;
    const newFileName = req.body.newFileName || file.originalname;

    if (!bucketName) {
        return res.status(400).send('Bucket name is required');
    }

    try {
        // Resize the image to 1920x1920 pixels using sharp
        const resizedImageBuffer = await sharp(file.buffer)
            .resize(1920, 1920, { fit: 'inside' })
            .toBuffer();

        // Construct the full object name using the folder path and file name
        const objectName = `${folderPath}/${newFileName}`;

        console.log(`Uploading to bucket: ${bucketName}, object: ${objectName}`); // Log for debugging

        // Upload the resized image buffer to MinIO
        await minioClient.putObject(bucketName, objectName, resizedImageBuffer);

        res.send(`File uploaded successfully to ${bucketName}/${objectName}.`);
    } catch (err) {
        console.error('Error during upload:', err); // Log the full error
        return res.status(500).send(err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});