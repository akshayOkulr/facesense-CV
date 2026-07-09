import moment from 'moment';

export const generateCalendarDates = () => {
  const dates = [];
  const today = moment();
  const startDate = moment(today).subtract(365, 'days'); // Show 1 year (365 days) before today
  const totalDays = 396; // 365 days before + today + 30 days after

  for (let i = 0; i < totalDays; i++) {
    const date = moment(startDate).add(i, 'days');
    const isToday = date.isSame(today, 'day');
    const isFuture = date.isAfter(today, 'day');

    dates.push({
      id: i.toString(),
      date: date.date(),
      day: date.format('ddd'),
      month: date.format('MMM').toUpperCase(),
      fullDate: date.format('YYYY-MM-DD'),
      isToday: isToday,
      isFuture: isFuture,
      disabled: isFuture, // Future dates are disabled
    });
  }

  return dates;
};

// Helper function to find today's index
export const getTodayIndex = () => {
  return 365; // Today is at index 365 (0-364 are past dates, 365 is today, 366-395 are future)
};
