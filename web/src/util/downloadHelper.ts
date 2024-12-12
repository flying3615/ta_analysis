export function downloadBlob(file: File | Blob, filename: string) {
  let tempFile = file;

  if (file instanceof Blob) {
    tempFile = new File([file], filename, { type: file.type });
  }

  // Create an object URL for the file
  const url = window.URL.createObjectURL(tempFile);
  // Create a new anchor element
  const a = document.createElement("a");
  // Set the href and download attributes of the anchor
  a.href = url;
  a.download = filename || "download";
  // Append the anchor to the body
  document.body.appendChild(a);
  // Click the anchor to start the download
  a.click();
  // Clean up: remove the anchor from the body and revoke the object URL
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
