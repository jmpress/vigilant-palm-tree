//Fetch variables
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

//Display Areas
    const filterArea = document.getElementById("filterArea");
    const ticketListArea = document.getElementById("ticketListArea");
    const loggedInUserArea = document.getElementById('uid');

//Button Assignment
    const newTicket = document.getElementById("newTicket");
    const testTicket = document.getElementById("testTicket");
    const showClosed = document.getElementById("showClosed");
    const logoutButton = document.getElementById("logout");
    let sortDir = [1,1,1,1,1];
    
//Object collection arrays
    let tickets = [];
    let users = [];

    let hideClosed = true;

    getTicketHeaders();
    //getCurrentUser();

//Fetch requests    
    async function getTicketHeaders(){
        const response = await fetch('/inbox');
        if(response.ok){
            tickets = await response.json();
            displayTicketHeaders();
        }
    }

    /*async function getCurrentUser(){      //this should use the info from req.user in some fashion
        const response = await fetch('/user/current');
        //console.log(response);
        if(response.ok){
            users = await response.json();
            console.log(users);
            loggedInUserArea.innerHTML = `User ID ${users[0].u_id}`
        }
        
    }*/

//Display and formatting
    function displayTicketHeaders(){
            let ticketHeaders = '<table class = "styled-table"><thead><tr><th onclick="sortOnID();">ID</th><th onclick="sortOnStatus();">Status</th><th onclick="sortOnPriority();">Priority</th><th>Summary</th><th onclick="sortOnFrom();">Regarding</th></tr></thead><tbody>';

            tickets.forEach(ticket => {
                if(ticket.ticket_status != 4 || hideClosed === false){
                    const priority = setPriority(ticket.ticket_priority)
                    const status = setStatus(ticket.ticket_status)
                
                    ticketHeaders = ticketHeaders + `<tr class = "row-highlight" id="link" onclick="document.location='./updateTicket.html?id=${ticket.ticket_id}';"><td>${ticket.ticket_id}</td><td>${status}</td><td>${priority}</td><td>${ticket.ticket_subject}</td><td>${ticket.ticket_from}</td>`;
                }
            });

            ticketHeaders += "</tbody></table>";
            ticketListArea.innerHTML=ticketHeaders;
            colID = document.getElementById('colID');
    }

//Event Listeners
    newTicket.addEventListener('click', () => {
        window.location.href = './newTicket.html';
    });

    showClosed.addEventListener('click', () => {
        hideClosed = !hideClosed;
        displayTicketHeaders();
    });

    logoutButton.addEventListener('click', async () =>{
        await fetch('/logout', {method:'POST'});
        window.location.href = './index.html';
    });

//Sorting functions
    function toggleSort(num){
        if(sortDir[num] === 1){
            sortDir[num] = -1;
        }else if(sortDir[num] === -1){
            sortDir[num] = 1;
        } else {
            
        }
    }

    function sortOnID(){
        tickets.sort((a, b) => {
            if(sortDir[0] === 1){
                return a.ticket_id - b.ticket_id;
            }else if(sortDir[0] === -1){
                return b.ticket_id - a.ticket_id;
            } else {
                return 0;
            }
        });
        toggleSort(0);
        displayTicketHeaders();
    }

    function sortOnStatus(){
        tickets.sort((a, b) => {
            if(sortDir[1] === 1){
                return a.ticket_status - b.ticket_status;
            }else if(sortDir[1] === -1){
                return b.ticket_status - a.ticket_status;
            } else {
                return 0;
            }
        });
        toggleSort(1);
        displayTicketHeaders();
    }

    function sortOnPriority(){
        tickets.sort((a, b) => {
            if(sortDir[2] === 1){
                return a.ticket_priority - b.ticket_priority;
            }else if(sortDir[2] === -1){
                return b.ticket_priority - a.ticket_priority;
            } else {
                return 0;
            }
        });
        toggleSort(2);
        displayTicketHeaders();
    }

/*  function sortOnSummary(){
        tickets.sort((a, b) => {
            if(sortDir[3] === 1){
                return a.ticket_summary - b.ticket_summary;
            }else if(sortDir[3] === -1){
                return b.ticket_summary - a.ticket_summary;
            } else {
                return 0;
            }
        });
        toggleSort(3);
        displayTicketHeaders();
    }*/    

    function sortOnFrom(){
        tickets.sort((a, b) => {
            if(sortDir[4] === 1){
                if(a.ticket_from <= b.ticket_from)
                    return -1;
            } else { 
                return 1;
            }
            if(sortDir[4] === -1){
                if(a.ticket_from > b.ticket_from)
                    return -1;
            } else { 
                return 1;
            }
        });
        toggleSort(4);
        displayTicketHeaders();
    }

//These functions should maybe be server-side?
    //No, because the server just wants integers. The front-end decides what those integers are used for.
    //These could just as easily be variations on a 4-point scale concept. More application-specific jargon may make itself apparent as time goes on.
    function setPriority(pCode){
        switch (pCode) {
            case 1:
                return 'Critical';
                break;
            case 2:
                return 'High';
                break;
            case 3:
                return 'Normal';
                break;
            case 4:
                return 'Low';
                break;
            default:
                return 'Normal';
                break;
        }
    }

function setStatus(sCode){
    switch (sCode) {
        case 1:
            return 'Open';
            break;
        case 2:
            return 'On Hold';
            break;
        case 3:
            return 'Pending';
            break;
        case 4:
            return 'Closed';
            break;
        default:
            return 'Open';
            break;
    }
}