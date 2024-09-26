// script.js
async function fetchBuckets() {
    try {
        const response = await fetch('http://localhost:3000/buckets');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const buckets = await response.json();
        const bucketSelect = document.getElementById('buckets');

        // Clear existing options
        bucketSelect.innerHTML = '';

        // Populate the select dropdown with bucket names
        if (buckets.length > 0) {
            buckets.forEach(bucket => {
                const option = document.createElement('option');
                option.value = bucket.name;
                option.textContent = bucket.name;
                bucketSelect.appendChild(option);
            });
        } else {
            // If no buckets are available, show a message
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No buckets available';
            bucketSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error fetching buckets:', error);
    }
}

document.getElementById('uploadForm').onsubmit = async function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const bucketName = document.getElementById('buckets').value; // Get selected bucket name
    const folderPath = document.getElementById('folderPath').value; // Get folder path
    const newFileName = document.getElementById('newFileName').value; // Get new file name
    const responseDiv = document.getElementById('response');

    // Append the selected bucket name, folder path, and new file name to the form data
    formData.append('bucketName', bucketName);
    formData.append('folderPath', folderPath);
    formData.append('newFileName', newFileName);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });
        const result = await response.text();
        responseDiv.innerText = result;
        responseDiv.style.color = '#28a745'; // Green color for success
        responseDiv.style.textAlign = 'center';
    } catch (error) {
        responseDiv.innerText = 'Error uploading file.';
        responseDiv.style.color = '#dc3545'; // Red color for error
        responseDiv.style.textAlign = 'center';
    }
};

// Call fetchBuckets on page load
window.onload = fetchBuckets;