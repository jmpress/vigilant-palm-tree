//Fetch variables
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

//Display area variables
    const currDate = document.getElementById('currDate');

//Input field variables
    const newPriority = document.getElementById('newPriority');
    const newSubj = document.getElementById('newSubj');
    const newDetails = document.getElementById('newDetails');
    const newRegarding = document.getElementById('regarding');

//Button variables
    const newTicketButton = document.getElementById('newTicket');
    const cancelNewButton = document.getElementById('cancelNew');

//Page Load actions
    currDate.innerHTML = todaysDate();

//eventHandlers
    newTicketButton.addEventListener('click', () => {
        
        
        newTx = {
            ticket_id: 0,
            open_date: todaysDate(),
            close_date: null,
            ticket_priority: newPriority.value,
            ticket_status: 1,
            ticket_subject: newSubj.value,
            ticket_description: newDetails.value,
            ticket_from: newRegarding.value,
            opener_id: 1,
            closer_id: null
        };
        postNewTicket(newTx);
    });

    cancelNewButton.addEventListener('click', () => {
        window.location.href = './inbox.html';
    });


//fetch request
    async function postNewTicket(newTx){
        //fetch POST request with appropriate headers (new Ticket object in body)
        const response = await fetch(`/tx/newTicket`, {method: 'POST', headers: headers, body: JSON.stringify(newTx)});
        if(response.ok){
            console.log('Should be good, check the DB');
            window.location.href = './inbox.html'
        } else {
            
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