export const lastdays = (days,initday)=>{
    const d = new Date(initday);
    d.setDate(d.getDate()-1);
    const start = new Date(d);
    start.setDate(start.getDate()-days);
      
    return start.toISOString().slice(0, 10);
}




