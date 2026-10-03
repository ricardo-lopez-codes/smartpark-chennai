export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const parseCleanDate = (isoString) => {
  if (!isoString) return new Date();
  if (isoString instanceof Date) return isoString;
  
  let cleanStr = String(isoString).trim();
  // Strip trailing Z or +00:00 / +05:30 offset specifiers so Javascript parses exact wall-clock time
  cleanStr = cleanStr.replace(/Z$/, '').replace(/\+00:00$/, '').replace(/\+05:30$/, '').replace(/T/, ' ');
  
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) return d;
  return new Date(isoString);
};

export const formatTime = (isoString) => {
  if (!isoString) return '--:--';

  let cleanStr = String(isoString).trim();
  // If it's a simple HH:MM time string like "20:00" or "08:30"
  if (cleanStr.includes(':') && !cleanStr.includes('T') && !cleanStr.includes(' ')) {
    const parts = cleanStr.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const h = parts[0];
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : `${m}`;
      return `${displayH}:${displayM} ${ampm}`;
    }
  }

  const d = parseCleanDate(isoString);
  if (isNaN(d.getTime())) return '--:--';

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = parseCleanDate(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDurationSeconds = (seconds) => {
  if (seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs]
    .map(v => v < 10 ? '0' + v : v)
    .join(':');
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
