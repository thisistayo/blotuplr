require('dotenv').config()
console.log(process.env)
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
let minioConfig = {
    endPoint: '192.168.1.200',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
}

console.log('CONFIG MINIO WITH')
console.log(minioConfig);

const minioClient = new Minio.Client(minioConfig);

console.log('Starting Minio')

minioClient.setRequestOptions({debug: true});

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Set file size limit to 10 MB (adjust as needed)
});
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on GET request to '/'
app.get('/', (req, res) => {
    res.json({blotpix_uploader: 'nothing else'});
});

// Endpoint to get the list of buckets
app.get('/buckets', async (req, res) => {
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

app.post('/login', async (req, res) => {
    console.log(req.body.username == process.env.MINIO_ACCESS_KEY)
    console.log(req.body.password == process.env.MINIO_SECRET_KEY)

    if ((req.body.username == process.env.MINIO_ACCESS_KEY) && (req.body.password == process.env.MINIO_SECRET_KEY)) {
        console.log('valid credentials sent')
        return res.status(200).json({ message: 'Login successful' });
    } else {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
})
// Endpoint to upload files with resizing
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const bucketName = req.body.bucket;
    const folderPath = req.body.path || '';
    const newFileName = req.body.newFileName;
    const resize = req.body.resize;
    console.log('This comes from the FE');
    console.log(req.body)

    if (!bucketName) {
        console.log
        return res.status(400).json({ error: 'Bucket name is required' });
    }

    try {
        let imageBuffer = file.buffer;

        if (resize) {
            imageBuffer = await sharp(file.buffer)
                .resize(1920, 1920, { fit: 'inside' })
                .toBuffer();
        }

        const objectName = path.join(folderPath, newFileName);

        console.log('BucketName: ' + bucketName);
        console.log('objectName: ' + objectName);

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