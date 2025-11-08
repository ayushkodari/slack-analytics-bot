export const lastdays = (days)=>{
    const d = new Date();
    d.setDate(d.getDate()-1);
    const start = new Date(d);
    start.setDate(start.getDate()-days);
      
    return start.toISOString().slice(0, 10);
}

export const lastMonthRanges = () => {
  const now = new Date();
  const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLast = new Date(now.getFullYear(), now.getMonth(), 0);

  const format = (d) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  return{
    startLast:format(startLast),
    endLast:format(endLast)
  }
};

export const monthStart =()=>{
    const now = new Date();
    const monthStart = new Date(now.getFullYear(),now.getMonth(),1);

    const format = (d) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

    return format(monthStart);
}

export const lastWeekDate=() =>{
  const currentDate = new Date();
  const endDate = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD' format
  currentDate.setDate(currentDate.getDate() - 7); // Set 7 days back
  const startDate = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD' format
  return { startDate, endDate };
}