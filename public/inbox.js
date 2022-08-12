//Fetch variables
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

//Display Areas
    const filterArea = document.getElementById("filterArea");
    const ticketListArea = document.getElementById("ticketListArea");

//Button Assignment
    const newTicket = document.getElementById("newTicket");
    const testTicket = document.getElementById("testTicket");

//Object collection arrays
    let tickets = [];

    getTicketHeaders();

//Fetch requests    
    async function getTicketHeaders(){
        const response = await fetch('/inbox');
        if(response.ok){
            tickets = await response.json();
            displayTicketHeaders();
        }
    }

//Display and formatting
    function displayTicketHeaders(){
            let ticketHeaders = `Tickets<br><table class = "styled-table"><thead><tr><th>ID</th><th>Status</th><th>Priority</th><th>Summary</th><th>From</th></tr></thead><tbody>`;

            tickets.forEach(ticket => {
                const priority = setPriority(ticket.ticket_priority)
                const status = setStatus(ticket.ticket_status)
                
                ticketHeaders = ticketHeaders + `<tr><td>${ticket.ticket_id}</td><td>${status}</td><td>${priority}</td><td>${ticket.ticket_subject}</td><td>${ticket.ticket_from}</td>`;
            });
            ticketHeaders += "</tbody></table>";
            ticketListArea.innerHTML=ticketHeaders;   
            
    }

//Event Listeners
    newTicket.addEventListener('click', () => {
        window.location.href = './newTicket.html'
    });

    testTicket.addEventListener('click', () => {
        testUpdate();
    });

//These functions should maybe be server-side?
    function setPriority(pCode){
        switch (pCode) {
            case 1:
                return 'Highest';
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

function testUpdate(){
    window.location.href = './updateTicket.html?id=4'
}