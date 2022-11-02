//Fetch variables
let headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

//Display area variables
const currDate = document.getElementById('currDate');

//Page Load actions
currDate.innerHTML = todaysDate();


//Helper functions
function todaysDate(){
    let currentDate = new Date();
    let cDay = currentDate.getDate();
    let cMonth = currentDate.getMonth() + 1;
    let cYear = currentDate.getFullYear();
    let dateString = `${cYear}-${cMonth}-${cDay}`;
    return dateString;
}