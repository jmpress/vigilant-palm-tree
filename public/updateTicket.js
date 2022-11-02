//Fetch variables
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

//Input field Variables
    const inputFieldArea = document.getElementById("inputFieldArea");
    let updatePriority;
    let updateStatus;
    let updateSubj;
    let oldDetails;
    let updateDetails;
    let updateRegarding;

//Button variables
    const updateTicketButton = document.getElementById('updateTicket');
    const cancelUpdateButton = document.getElementById('cancelUpdate');

//Data variables
    let OGTicket = {};

//fetch the required info
    const targetID = getQueryVariable('id')
    getTicket(targetID);
    

//Page Load actions  - not many because majority of page is built after.


//eventHandlers

    updateTicketButton.addEventListener('click', async () => {
        updatePriority = document.getElementById('updatePriority');
        updateStatus = document.getElementById('updateStatus');
        updateSubj = document.getElementById('updateSubj');
        oldDetails = document.getElementById('oldDetails');
        updateDetails = document.getElementById('updateDetails');
        updateRegarding = document.getElementById('updateRegarding');
        let close_date;
        let open_date;
        let closer_id;
        let combined_description;

        if(OGTicket.ticket_status != 4 && updateStatus.value == 4){ //if closing

            close_date = todaysDate();
            closer_id = 1;   //currently logged in USER
            open_date = OGTicket.open_date;

        } else {
            close_date = null;
            closer_id = null;
            open_date = todaysDate();
        }

        combined_description = concatDetails(todaysDate(), updateDetails.value, oldDetails.value);

        updatedTx = {
            ticket_id: OGTicket.ticket_id,
            open_date: open_date,
            close_date: close_date,
            ticket_priority: updatePriority.value,
            ticket_status: updateStatus.value,
            ticket_subject: OGTicket.ticket_subject,
            ticket_description: combined_description,
            ticket_from: updateRegarding.value,
            opener_id: 1,
            closer_id: closer_id
        };
        await saveTicket(updatedTx);
        window.location.href = './inbox.html';
    });

    cancelUpdateButton.addEventListener('click', () => {
        window.location.href = './inbox.html';
    });

//fetch request
    async function getTicket(targetID){
        const response = await fetch (`/tx/updateTicket/${targetID}`, {method: 'GET', headers: headers});
        if(response.ok){
            OGTicket = await response.json();
            
            displayTicket();
        }else{
            console.log('getTicket Error');
        }
    }

    async function saveTicket(updateTx){
        //fetch POST request with appropriate headers (update Ticket object in body)
        const response = await fetch(`/tx/updateTicket/${updateTx.ticket_id}`, {method: 'PUT', headers: headers, body: JSON.stringify(updateTx)});
        if(response.ok){
            console.log('ticket saved');
        } else {
            console.log('saveTicket Error');
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
        const currentDate = todaysDate();

        let displayString = `<form><label for="updatePriority">Priority:</label><select name="updatePriority" id="updatePriority">`;
                        
        if(OGTicket.ticket_priority === 1){
            displayString += `<option value="1" selected>Critical</option>`;
        } else {
            displayString += `<option value="1" >Critical</option>`;
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

        displayString += `<label for="updateStatus"> Status:</label><select name="updateStatus" id="updateStatus">`;

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

        displayString += `<label for="updateSubj">Subject:</label><input id="updateSubj" type = "text" value = "${OGTicket.ticket_subject}" readonly><br>`;
        displayString += `<label for="oldDetails">Original Ticket Details</label><br><textarea id="oldDetails" type = "text" rows="4" cols="50" readonly>${OGTicket.ticket_description}</textarea><br>`;
        displayString += `<label for="updateDetails">Any New Details?:</label><br><textarea id="updateDetails" type = "text" rows="4" cols="50" required></textarea><br><label for="updateRegarding">Regarding:</label>`;
        displayString += `<input id="updateRegarding" type = "text" value = "${OGTicket.ticket_from}" readonly><br>`;
        displayString += `<p>Current Date: <span id="currDate">${currentDate}</span></p></form>`;
        
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

//This works as intended.
    function concatDetails(todayDate, newDetails, oldDetails){
        /*this function is used for making sure useful information gets concatenated into the detail field.
            This field should be structured as such:
                {open date} initial details by case-opener(linebreak)
                {edit date} new details by next person working on it.(linebreak)    --how to do a linebreak that is going to be stored in SQL and also displayed in HTML?
                {edit date} new details by next person working on it.(linebreak)
                {edit date} new details by next person working on it.(linebreak)
                {closed} on {closed date}
        */
        const finalResult = '' + oldDetails + '|' + todayDate + ': ' + newDetails + '|';
        if(finalResult.length > 500){
            console.log('max characters reached in description.')
            finalResult = finalResult.slice(0, 500);
        }
        return finalResult;

    }