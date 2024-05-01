document.getElementById('dropZone').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', uploadFiles);
document.getElementById('dropZone').addEventListener('drop', (event) => {
    event.preventDefault();
    uploadFiles(event.dataTransfer);
});
document.getElementById('dropZone').addEventListener('dragover', (event) => {
    event.preventDefault();
});

async function uploadFiles(dataTransfer) {
    const files = dataTransfer.files;
    for (const file of files) {
        const filename = encodeURIComponent(file.name);
        const response = await fetch(`https://o0nc3e2ej2.execute-api.ap-northeast-1.amazonaws.com/prod/content?filename=${filename}`);
        const data = await response.json();
        const url = data.uploadUrl;
        console.log('Uploading:', file.name, 'to', url);

        await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        addToList(file.name);
    }
}

function addToList(fileName) {
    const node = document.createElement('div');
    node.innerText = fileName;
    node.className = 'file-name';
    node.onclick = () => {
        navigator.clipboard.writeText(fileName);
        alert('Copied: ' + fileName);
    };
    document.getElementById('uploadedFiles').appendChild(node);
}
