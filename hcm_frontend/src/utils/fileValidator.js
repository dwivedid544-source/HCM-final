// src/utils/fileValidator.js
/**
 * Validate a file against allowed extensions and max size.
 * Extensions should be WITHOUT leading dot, e.g. ['pdf', 'png', 'jpg'].
 * @param {File} file - The file object to validate.
 * @param {string[]} allowedExts - Array of allowed extensions without dot (e.g. ['pdf', 'png']).
 * @param {number} maxSizeMB - Maximum size in megabytes.
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateFile(file, allowedExts, maxSizeMB) {
  if (!file) {
    const msg = 'No file selected.';
    return { isValid: false, valid: false, message: msg, error: msg };
  }
  const fileName = file.name ? file.name.toLowerCase() : '';
  const ext = fileName.split('.').pop();
  const normalizedExts = Array.isArray(allowedExts) 
    ? allowedExts.map((e) => e.replace(/^\./, '').toLowerCase())
    : [];
  
  if (normalizedExts.length > 0 && !normalizedExts.includes(ext)) {
    const msg = `Unsupported file type ".${ext}". Allowed: ${normalizedExts.map((e) => '.' + e).join(', ')}`;
    return {
      isValid: false,
      valid: false,
      message: msg,
      error: msg,
    };
  }
  const sizeMB = file.size / (1024 * 1024);
  if (maxSizeMB && sizeMB > maxSizeMB) {
    const msg = `File too large (${sizeMB.toFixed(1)} MB). Max allowed: ${maxSizeMB} MB.`;
    return {
      isValid: false,
      valid: false,
      message: msg,
      error: msg,
    };
  }
  return { isValid: true, valid: true, message: '', error: '' };
}
