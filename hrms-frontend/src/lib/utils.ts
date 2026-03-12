export function getImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    
    // Convert Google Drive view URLs to direct image URLs
    // View: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
    // Open: https://drive.google.com/open?id=FILE_ID
    // Direct: https://lh3.googleusercontent.com/u/0/d/FILE_ID or https://drive.google.com/uc?export=view&id=FILE_ID
    
    if (url.includes('drive.google.com')) {
        let fileId = '';
        const matchFileD = url.match(/\/file\/d\/([^/]+)/);
        const matchIdParam = url.match(/[?&]id=([^&]+)/);
        
        if (matchFileD) fileId = matchFileD[1];
        else if (matchIdParam) fileId = matchIdParam[1];
        
        if (fileId) {
            // Using the uc?export=view method as it's more standard for simple img tags
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    }
    
    return url;
}
