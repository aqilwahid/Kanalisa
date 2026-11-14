(function (root, factory) {
  const exports = factory();
  if (typeof module === 'object' && module.exports) module.exports = exports;
  else root.Kanalisa = Object.assign(root.Kanalisa || {}, exports);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    const absolute = Math.abs(number);
    if (absolute >= 1000000000) return `${numberFormatter.format(number / 1000000000)} M`;
    if (absolute >= 1000000) return `${numberFormatter.format(number / 1000000)} jt`;
    if (absolute >= 1000) return `${numberFormatter.format(number / 1000)} rb`;
    return numberFormatter.format(number);
  }

  function formatPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0%';
    return `${numberFormatter.format(number * 100)}%`;
  }

  function formatCurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number).replace(/\s/g, '');
  }

  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
    }).format(date);
  }

  function formatAge(hours, labels = {}) {
    const messages = Object.assign({ lessThanOneHour: '< 1 jam', hours: '$1 jam', days: '$1 hari' }, labels);
    if (!Number.isFinite(hours) || hours < 1) return messages.lessThanOneHour;
    const value = hours < 24 ? Math.floor(hours) : Math.floor(hours / 24);
    return (hours < 24 ? messages.hours : messages.days).replace('$1', value);
  }

  return { formatNumber, formatPercent, formatCurrency, formatDate, formatAge };
});

