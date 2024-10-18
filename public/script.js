document.addEventListener('DOMContentLoaded', function () {
    const bucketSelect = document.getElementById('buckets');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const uploadForm = document.getElementById('uploadForm');

    // Fetch buckets from the server
    async function fetchBuckets() {
        try {
            const response = await fetch('https://blotuplr.hbvu.su/buckets');
            if (!response.ok) {
                console.log('unable to fetch buckets')
                throw new Error('Network response was not ok');
            }
            const buckets = await response.json();
            buckets.forEach(bucket => {
                const option = document.createElement('option');
                option.value = bucket.name;
                option.textContent = bucket.name;
                bucketSelect.appendChild(option);
            });
            console.log(bucketSelect)
        } catch (error) {
            console.error('Error fetching buckets:', error);
        }
    }

    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Populate month dropdown
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = (index + 1).toString().padStart(2, '0'); // 01, 02, ..., 12
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    // Set default to current year and month
    const currentDate = new Date();
    yearSelect.value = currentDate.getFullYear();
    monthSelect.value = (currentDate.getMonth() + 1).toString().padStart(2, '0');

    // Handle form submission
    uploadForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(this);

        // Get the selected bucket
        const selectedBucket = document.getElementById('buckets').value;

        // Construct the folder path
        const folderPath = `${formData.get('year')}/${formData.get('month')}`;
        formData.append('bucketName', selectedBucket);
        formData.append('folderPath', folderPath);

        // Remove individual year and month from formData
        formData.delete('year');
        formData.delete('month');

        console.log('This is the form data on the client side')
        console.log(formData);

        try {
            const response = await fetch('https://blotuplr.hbvu.su/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.text();
            document.getElementById('response').textContent = result;
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('response').textContent = 'Error uploading file.';
        }
    });

    // Call fetchBuckets to populate the bucket dropdown
    fetchBuckets();
});