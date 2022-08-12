//Fetch variables
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

//Input field Variables
    const inputFieldArea = document.getElementById('inputFieldArea');
    const updatePriority = document.getElementById('updatePriority');
    const updateStatus = document.getElementById('updateStatus');
    const updateSubj = document.getElementById('updateSubj');
    const oldDetails = document.getElementById('oldDetails');
    const updateDetails = document.getElementById('updateDetails');
    const updateRegarding = document.getElementById('updateRegarding');

//Button variables
    const updateTicketButton = document.getElementById('updateTicket');

//Data variables
    let OGTicket = {};

//fetch the required info
    const targetID = getQueryVariable('id')
    getTicket(targetID); //THIS ISN'T SETTING THE OGTicket object appropriately.
    
    
    

//Page Load actions  - not many because majority of page is built after.


//eventHandlers

    updateTicketButton.addEventListener('click', () => {
        let close_date;
        let open_date;
        let closer_id;

        if(OGTicket.ticket_status != 4 && updateStatus.value === 4){ //if closing
            close_date = todaysDate();
            closer_id = 1;   //currently logged in USER
            open_date = OGTicket.open_date;
        } else {
            close_date = null;
            closer_id = null;
            open_date = todaysDate();
        }

        updatedTx = {
            ticket_id: OGTicket.ticket_id,
            open_date: open_date,
            close_date: close_date,
            ticket_priority: updatePriority.value,
            ticket_status: updateStatus.value,
            ticket_subject: updateSubj.value,
            ticket_description: updateDetails.value,
            ticket_from: updateRegarding.value,
            opener_id: 1,
            closer_id: closer_id
        };
        saveTicket(updatedTx);
    });


//fetch request
    async function getTicket(targetID){
        console.log(targetID);
        const response = await fetch (`/updateTicket/${targetID}`, {method: 'GET', headers: headers});
        if(response.ok){
            OGTicket = await response.json();
            console.log(OGTicket);
            displayTicket();
        }else{
            console.log('getTicket Error');
        }
    }

    async function saveTicket(updateTx){
        //fetch POST request with appropriate headers (update Ticket object in body)
        console.log(updateTx);
        const response = await fetch(`/updateTicket`, {method: 'PUT', headers: headers, body: JSON.stringify(updateTx)});
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

    function displayTicket(){
        console.log(OGTicket);
        const currentDate = todaysDate();

        let displayString = `<form><label for="updatePriority">Priority:</label><select name="updatePriority" id="updatePriority">`;
                        
        if(OGTicket.ticket_priority === 1){
            displayString += `<option value="1" selected>Highest</option>`;
        } else {
            displayString += `<option value="1" >Highest</option>`;
        }
        if(OGTicket.ticket_priority === 2){
            displayString += `<option value="2" selected>High</option>`;
        } else {
            displayString += `<option value="2" >High</option>`;
        }
        if(OGTicket.ticket_priority === 3){
            displayString += `<option value="3" selected>Normal</option>`;
        } else {
            displayString += `<option value="3" >Normal</option>`;
        }
        if(OGTicket.ticket_priority === 4){
            displayString += `<option value="4" selected>Low</option></select>`;
        } else {
            displayString += `<option value="4" >Low</option></select>`;
        }       

        displayString += `<label for="updateStatus">Status:</label><select name="updateStatus" id="updateStatus">`;

        if(OGTicket.ticket_status === 1){
            displayString += `<option value="1" selected>Open</option>`;
        } else {
            displayString += `<option value="1" >Open</option>`;
        }
        if(OGTicket.ticket_status === 2){
            displayString += `<option value="2" selected>On Hold</option>`;
        } else {
            displayString += `<option value="2" >On Hold</option>`;
        }
        if(OGTicket.ticket_status === 3){
            displayString += `<option value="3" selected>Pending</option>`;
        } else {
            displayString += `<option value="3" >Pending</option>`;
        }
        if(OGTicket.ticket_status === 4){
            displayString += `<option value="4" selected>Closed</option></select><br>`;
        } else {
            displayString += `<option value="4" >Closed</option></select><br>`;
        }

        displayString += `<label for="updateSubj">Subject:</label><input id="newSubj" type = "text" value = "${OGTicket.ticket_subject}" readonly><br>`;
        displayString += `<p id="oldDetails">${OGTicket.ticket_description}</p><br>`;
        displayString += `<label for="updateDetails">Any New Details?:</label><br><textarea id="updateDetails" type = "text" rows="4" cols="50"required></textarea><br><label for="updateRegarding">Regarding:</label>`;
        displayString += `<input id="updateRegarding" type = "text" value = "${OGTicket.ticket_from}" readonly><br>`;
        displayString += `<p>Current Date: <span id="currDate">${currentDate}</span> | Logged in as <span id="uid">NONE</span></p></form>`;

        inputFieldArea.innerHTML = displayString;
    }

//use this by passing in "id" with "id=x" in string to return "x".
    function getQueryVariable(variable)
    {
        const query = window.location.search.substring(1);
        let vars = query.split("&");
        for (let i=0;i<vars.length;i++) {
                let pair = vars[i].split("=");
                if(pair[0] == variable){return pair[1];}
        }
        return(false);
    }