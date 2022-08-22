//Fetch variables
let headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

//Display area variables
const currDate = document.getElementById('currDate');

//Input field variables
const userEmail = document.getElementById('userEmail');
const userPassA = document.getElementById('userPassA');
const userPassB = document.getElementById('userPassB');

//Button variables
const registerButton = document.getElementById('register');
const cancelNewButton = document.getElementById('cancelNew');

//Page Load actions
currDate.innerHTML = todaysDate();

//eventHandlers
registerButton.addEventListener('click', async () => {
    if(checkSamePass()){
        newUser = {
            u_id: 0,
            u_email: userEmail.value,
            provider_id: '',
            provider_name: 'local',
            auth_token: '',
            plain_pass: userPassA.value,
            num_tix_closed: 0
        };
        await postNewUser(newUser);
    }
});

cancelNewButton.addEventListener('click', () => {
    window.location.href = './index.html';
});


//fetch request
async function postNewUser(newUser){
    //fetch POST request with appropriate headers (new User object in body)
    const response = await fetch(`/user/new`, {method: 'POST', headers: headers, body: JSON.stringify(newUser)});
    if(response.ok){
        console.log('Should be good, check the DB');
        result = await response.json();
        window.location.href = './inbox.html'
    } else {
        console.log('error in POST');
    }
}

//Helper functions
function todaysDate(){
let currentDate = new Date();
let cDay = currentDate.getDate();
let cMonth = currentDate.getMonth() + 1;
let cYear = currentDate.getFullYear();
let dateString = `${cYear}-${cMonth}-${cDay}`;
return dateString;
}

function checkSamePass(){
    if(userPassA.value !=  userPassB.value || userPassA.value === '' || userPassB.value === ''){
        window.alert('Passwords must exist and match!')
        return false;
    } else {
        return true;
    }
    
}