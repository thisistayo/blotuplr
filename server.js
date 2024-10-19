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

app.use(express.json({ limit: '50mb' })); // Increase the JSON payload size limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase the URL-encoded payload size limit

// Setup MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.S3_ENDPOINT || 'https://objects.hbvu.su',
    port: process.env.S3_PORT || 443,
    useSSL: process.env.S3_USE_SSL !== 'false',
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY
});

let bucketsList = ['blotpix'];

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Set file size limit to 10 MB (adjust as needed)
});
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on GET request to '/'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get the list of buckets
app.get('/', async (req, res) => {
    const defaultBuckets = ['blotpix', 'test'];

    try {
        const buckets = await minioClient.listBuckets();
        const bucketNames = buckets.map(bucket => bucket.name);
        res.json(bucketNames);
    } catch (err) {
        console.error('Error fetching buckets:', err);
        console.log('Using default buckets due to error');
        res.json(defaultBuckets);
    }
});

// Endpoint to upload files with resizing
app.post('/', upload.single('file'), async (req, res) => {
    const file = req.file;
    const bucketName = req.body.bucket;
    const folderPath = req.body.path || '';
    const newFileName = req.body.newFileName || file.originalname;
    const resize = req.body.resize === 'true';
    const resizeWidth = parseInt(req.body.resizeWidth) || 1920;
    const resizeHeight = parseInt(req.body.resizeHeight) || 1920;

    if (!bucketName) {
        return res.status(400).json({ error: 'Bucket name is required' });
    }

    try {
        let imageBuffer = file.buffer;

        if (resize) {
            imageBuffer = await sharp(file.buffer)
                .resize(resizeWidth, resizeHeight, { fit: 'inside' })
                .toBuffer();
        }

        const objectName = path.join(folderPath, newFileName);

        await minioClient.putObject(bucketName, objectName, imageBuffer);

        res.json({ message: `File uploaded successfully to ${bucketName}/${objectName}.` });
    } catch (err) {
        console.error('Error during upload:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});