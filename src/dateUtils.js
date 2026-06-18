export function formatDateReadable(dateStr, suffix) {
  if (!dateStr) return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    let out = dateStr;
    if (suffix && !out.includes(suffix)) {
      out += ` - ${suffix}`;
    }
    return out;
  }
  const [_, y, m, d] = match;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const weekday = weekdayNames[date.getDay()];
  
  let formatted = `${month} ${day}, ${weekday}`;
  if (suffix && suffix.trim()) {
    formatted += ` - ${suffix.trim()}`;
  }
  return formatted;
}

export function parseToYyyyMmDd(dateStr, year) {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const lower = clean.toLowerCase();
  let foundMonthIdx = -1;
  let foundMonthName = "";
  for (let i = 0; i < monthNames.length; i++) {
    if (lower.includes(monthNames[i])) {
      foundMonthIdx = i;
      foundMonthName = monthNames[i];
      break;
    }
  }
  
  if (foundMonthIdx !== -1) {
    const afterMonth = lower.split(foundMonthName)[1] || "";
    const beforeMonth = lower.split(foundMonthName)[0] || "";
    const dayMatch = afterMonth.match(/\d+/) || beforeMonth.match(/\d+/);
    if (dayMatch) {
      const dayVal = parseInt(dayMatch[0], 10);
      if (dayVal >= 1 && dayVal <= 31) {
        const mm = String(foundMonthIdx + 1).padStart(2, '0');
        const dd = String(dayVal).padStart(2, '0');
        const yyyy = String(year || new Date().getFullYear());
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }
  
  return `${year || new Date().getFullYear()}-01-01`;
}
