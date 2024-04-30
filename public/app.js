async function uploadFile() {
  const file = document.getElementById('fileInput').files[0];
  const filename = encodeURIComponent(file.name);
  const response = await fetch(`https://あなたのAPIエンドポイント?url=${filename}`);
  const data = await response.json();
  const url = data.uploadUrl;

  const result = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
          'Content-Type': 'application/octet-stream'
      }
  });

  if (result.ok) {
      alert('File uploaded successfully.');
  } else {
      alert('Upload failed.');
  }
}
