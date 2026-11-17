/**
 * הוספת ימי עסקים. שבוע העבודה בישראל: ראשון–חמישי; שישי ושבת לא נספרים.
 * (חגים לא נלקחים בחשבון.)
 */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay(); // 5 = שישי, 6 = שבת
    if (dow !== 5 && dow !== 6) left -= 1;
  }
  return d;
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
