//Fetch variables
let headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

//Display area variables
const currDate = document.getElementById('currDate');

//Input field variables
const userName = document.getElementById('userName');
const passWord = document.getElementById('passWord');


//Button variables
const loginButton = document.getElementById('login');
const registerButton = document.getElementById('register');

//Page Load actions
currDate.innerHTML = todaysDate();

//eventHandlers
loginButton.addEventListener('click', () => {
    
});

registerButton.addEventListener('click', () => {
    window.location.href = './newUser.html';
});

//Helper functions
function todaysDate(){
let currentDate = new Date();
let cDay = currentDate.getDate();
let cMonth = currentDate.getMonth() + 1;
let cYear = currentDate.getFullYear();
let dateString = `${cYear}-${cMonth}-${cDay}`;
return dateString;
}