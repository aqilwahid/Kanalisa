export function formatNumberIndonesian(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace('.', ',') + ' M';
  }
  if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace('.', ',') + ' jt';
  }
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1).replace('.', ',') + ' rb';
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatNumberCompact(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatCurrencyIDR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp0';
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1_000_000_000) {
    return 'Rp' + (amount / 1_000_000_000).toFixed(1).replace('.', ',') + ' M';
  }
  if (absAmount >= 1_000_000) {
    return 'Rp' + (amount / 1_000_000).toFixed(1).replace('.', ',') + ' jt';
  }
  if (absAmount >= 1_000) {
    return 'Rp' + (amount / 1_000).toFixed(1).replace('.', ',') + ' rb';
  }
  return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDateIndonesian(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeIndonesian(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${time} WIB`;
}

export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} minggu lalu`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} bulan lalu`;
  return `${Math.floor(diffDay / 365)} tahun lalu`;
}

export function formatDuration(isoDuration) {
  if (!isoDuration) return '-';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '-';
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatEngagementRate(rate) {
  if (rate === null || rate === undefined || isNaN(rate)) return '0%';
  return (rate * 100).toFixed(2).replace('.', ',') + '%';
}

export function formatVPH(vph) {
  if (vph === null || vph === undefined || isNaN(vph)) return '0/jam';
  return formatNumberIndonesian(Math.round(vph)) + '/jam';
}

export function formatRatio(ratio) {
  if (ratio === null || ratio === undefined || isNaN(ratio)) return '-';
  return ratio.toFixed(1).replace('.', ',') + '×';
}