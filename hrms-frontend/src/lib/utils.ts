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
            // Using the thumbnail service as it's more reliable for embedding than uc?export=view
            // sz=s1000 ensures a high quality version
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=s1000`;
        }
    }
    
    return url;
}

export function playAttendanceSound(type: 'checkin' | 'checkout') {
    if (typeof window === 'undefined') return;
    
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'checkin') {
            // High-pitched, pleasant double-beep
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, now); // A5
            oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // E6
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        } else {
            // Slightly deeper, neutral tone
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, now); // A4
            oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.2); // A3
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        }

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    } catch (e) {
        console.warn("Audio feedback failed:", e);
    }
}
