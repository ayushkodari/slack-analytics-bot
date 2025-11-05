export const Last7days = ()=>{
    const days7 = new Date();
    days7.setDate(days7.getDate()-1);
    const start = new Date(days7);
    start.setDate(start.getDate()-6);
      
    return start.toISOString().slice(0, 10);;
}

console.log(Last7days());


