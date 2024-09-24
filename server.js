const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Setup MinIO client
const minioClient = new Minio.Client({
    endPoint: 'objects.hbvu.su',
    port: 443,
    useSSL: true, // Set to true if using HTTPS
    accessKey: 'lucarv',
    secretKey: 'lucaPWD$MinI0'
});

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to upload files
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    const bucketName = 'your-bucket-name'; // Specify your bucket name

    minioClient.putObject(bucketName, file.originalname, file.buffer, (err, etag) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(`File uploaded successfully. ETag: ${etag}`);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
