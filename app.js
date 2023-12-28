require('dotenv').config();
const fs = require('fs');
const logFile = 'error.log';
const axios = require('axios');
const usersMapping = require('./users.json');

// URLs and App Tokens for the old and new GLPI systems
const oldBaseUrl = process.env.OLD_BASE_URL;
const newBaseUrl = process.env.NEW_BASE_URL;
const oldGLPIUrl = `${oldBaseUrl}/Ticket`;
const newGLPIUrl = `${newBaseUrl}/Ticket`;
const oldAppToken = process.env.OLD_APP_TOKEN;
const newAppToken = process.env.NEW_APP_TOKEN;
const batchSize = parseInt(process.env.BATCH_SIZE); // Number of tickets to fetch in each request
const newGlpiDefaultUserId = parseInt(process.env.NEW_GLPI_DEFAULT_USER_ID);
const newGlpiDefaultUserEmail = process.env.NEW_GLPI_DEFAULT_USER_EMAIL;

// Authorization keys for the old and new GLPI systems
const oldAuthKey = process.env.OLD_AUTH_KEY;
const newAuthKey = process.env.NEW_AUTH_KEY;

function logError(message) {
    fs.appendFileSync(logFile, message + '\n', (err) => {
        if (err) console.error('Unable to log to file', err);
    });
}

function getUserId(email) {
    if (!email) {
        return newGlpiDefaultUserId;
    }
    const user = usersMapping.find(user => user.email === email); // users_id comes from users.json
    return user ? user.users_id : newGlpiDefaultUserId;
}


// Function to get a session token from GLPI API
async function getSessionToken(baseUrl, appToken, authKey) {
    const response = await axios.get(`${baseUrl}/initSession/?expand_dropdowns=true&app_token=${appToken}`, {
        headers: {
            'Authorization': authKey
        }
    });
    return response.data.session_token;
}

// Get Ticket details from old GLPI
async function fetchTicketDetails(ticketId, sessionToken) {

    // TicketUsers
    let ticketUsers = [];
    const ticketUsersResponse = await axios.get(`${oldGLPIUrl}/${ticketId}/Ticket_User`, {
        headers: { 'App-Token': oldAppToken, 'Session-Token': sessionToken }
    });
    ticketUsers = ticketUsersResponse.data;

    // Get/Set EMAIL into each ticketUsers
    for (let i = 0; i < ticketUsers.length; i++) {
        try {
            // invalid UserID of ticketUser skipping
            if (!ticketUsers[i].users_id || ticketUsers[i].users_id === 0) {
                console.warn("TicketUsers: Invalid user ID found, can't get EMAIL skipping: ", ticketUsers[i].users_id);
                continue; 
            }
            const userEmailResponse = await axios.get(`${oldBaseUrl}/User/${ticketUsers[i].users_id}/UserEmail`, {
                headers: { 'App-Token': oldAppToken, 'Session-Token': sessionToken }
            });
            const userEmailData = userEmailResponse.data[0];
            ticketUsers[i].email = userEmailData.email; // add email adress to user

        } catch (error) {
            // Use default email if this email no more exists
            ticketUsers[i].email = newGlpiDefaultUserEmail;
            logError(`ticketUsers Details: Error fetching ticket USER details for Ticket ID ${ticketId}: ${error}`);
            console.log("Ticket User Email not found ***DEFAULT EMAIL USED! ticket's users_id was " + ticketUsers[i].users_id+"Ticket ID : "+ticketId)
        }

    }

    // Ticket Followups
    let ticketFollowups = [];

    try {
        const ticketFollowupsResponse = await axios.get(`${oldGLPIUrl}/${ticketId}/ITILFollowup`, {
            headers: { 'App-Token': oldAppToken, 'Session-Token': sessionToken }
        });
        ticketFollowups = ticketFollowupsResponse.data;

    } catch (error) {
        console.error("Ticket follow-ups fetch error: ", error);
        // If error return an array empty
        return { ticketUsers: [], ticketFollowups: [] }; //TODO check here
    }

    if (ticketFollowups.length === 0) {
        console.log("INFO 01 - No follow-ups found for ticket ID: ", ticketId);
    } else {
        // update users_id and links for each followup
        for (let i = 0; i < ticketFollowups.length; i++) {
            try {
                const userId = ticketFollowups[i].users_id;
                if (!userId || userId === 0) {
                    console.warn("  INFO 02 - - ticketFollowups: Invalid user ID found: ", userId);
                    continue;
                    //TODO Add invalid IDs to csv file
                }

                const userEmailResponse = await axios.get(`${oldBaseUrl}/User/${ticketFollowups[i].users_id}/UserEmail`, {
                    headers: { 'App-Token': oldAppToken, 'Session-Token': sessionToken }
                });
                const userEmailData = userEmailResponse.data[0];
                const newUserId = getUserId(userEmailData.email);

                ticketFollowups[i].users_id = newUserId; //Transform users_id of followup into new glpi users_id

                ticketFollowups[i].links = ticketFollowups[i].links.map(link => ({
                    ...link,
                    href: link.href.replace(`${oldBaseUrl}`, `${newBaseUrl}`)
                }));

            } catch (error) {
                logError(`Error fetching ticket details for Ticket ID ${ticketId}: ${error}`);
                console.error("Error updating ticket follow-up: ", error);
            }

        }
    }


    return { ticketUsers, ticketFollowups };

}


// Function to transform ticket data to the new GLPI format
function transformToNewGLPIFormat(ticket) {
    const updatedLinks = ticket.links.map(link => ({
        ...link,
        href: link.href.replace(`${oldBaseUrl}`, `${newBaseUrl}`)
    }));


    return {
        input: {
            id: ticket.id,
            entities_id: ticket.entities_id,
            name: ticket.name,
            date: ticket.date,
            closedate: ticket.closedate,
            solvedate: ticket.solvedate,
            takeintoaccountdate: ticket.takeintoaccountdate,
            date_mod: ticket.date_mod,
            users_id_lastupdater: ticket.users_id_lastupdater,
            status: ticket.status,
            users_id_recipient: ticket.users_id_recipient,
            requesttypes_id: ticket.requesttypes_id,
            content: ticket.content,
            urgency: ticket.urgency,
            impact: ticket.impact,
            priority: ticket.priority,
            itilcategories_id: ticket.itilcategories_id,
            type: ticket.type,
            global_validation: ticket.global_validation,
            slas_id_ttr: ticket.slas_id_ttr,
            slas_id_tto: ticket.slas_id_tto,
            slalevels_id_ttr: ticket.slalevels_id_ttr,
            time_to_resolve: ticket.time_to_resolve,
            time_to_own: ticket.time_to_own,
            begin_waiting_date: ticket.begin_waiting_date,
            sla_waiting_duration: ticket.sla_waiting_duration,
            ola_waiting_duration: ticket.ola_waiting_duration,
            olas_id_tto: ticket.olas_id_tto,
            olas_id_ttr: ticket.olas_id_ttr,
            olalevels_id_ttr: ticket.olalevels_id_ttr,
            ola_ttr_begin_date: ticket.ola_ttr_begin_date,
            internal_time_to_resolve: ticket.internal_time_to_resolve,
            internal_time_to_own: ticket.internal_time_to_own,
            waiting_duration: ticket.waiting_duration,
            close_delay_stat: ticket.close_delay_stat,
            solve_delay_stat: ticket.solve_delay_stat,
            takeintoaccount_delay_stat: ticket.takeintoaccount_delay_stat,
            actiontime: ticket.actiontime,
            is_deleted: ticket.is_deleted,
            locations_id: ticket.locations_id,
            validation_percent: ticket.validation_percent,
            date_creation: ticket.date_creation,
            links: updatedLinks
        }
    };
}


// ADD to new GLPI System {Tickets => TicketUsers => TicketFollowups}
async function addTicketToNewGLPI(ticket, ticketUsers, ticketFollowups, sessionToken) {
    try {
        //CREATE TICKETS
    const transformedTicket = transformToNewGLPIFormat(ticket);
    await axios.post(`${newGLPIUrl}`, transformedTicket, {
        headers: { 'Content-Type': 'application/json', 'App-Token': newAppToken, 'Session-Token': sessionToken }
    });


    //ADD ticketUsers to tickets
    for (const user of ticketUsers) {
        
        const newUserId = getUserId(user.email);
        const userData = {
            input: {
                tickets_id: ticket.id.toString(),
                users_id: newUserId.toString(),
                type: user.type.toString(),
                use_notification: user.use_notification.toString()
            }
        };

        await axios.post(`${newBaseUrl}/Ticket/${ticket.id}/Ticket_User`, userData, {
            headers: { 'Content-Type': 'application/json', 'App-Token': newAppToken, 'Session-Token': sessionToken }
        });

    }

    //ADD Followups to tickets
    for (const followup of ticketFollowups) {

        const followupData = {
            input: {
                date: followup.date,
                users_id: followup.users_id,
                tickets_id: followup.items_id.toString(),
                is_private: followup.is_private,
                requesttypes_id: followup.requesttypes_id || 6,
                content: followup.content
            }
        };

        await axios.post(`${newBaseUrl}/Ticket/${ticket.id}/TicketFollowup`, followupData, {
            headers: { 'Content-Type': 'application/json', 'App-Token': newAppToken, 'Session-Token': sessionToken }
        });
    }
    } catch (error) {
        logError(`Error adding Ticket ID ${ticket.id}: ${error}`);
    }
    

}

// Ticket transfer
async function transferTickets() {
    try {
        const oldSessionToken = await getSessionToken(`${oldBaseUrl}`, oldAppToken, oldAuthKey);
        console.log('Old glpi session created');
        const newSessionToken = await getSessionToken(`${newBaseUrl}`, newAppToken, newAuthKey);
        console.log('New glpi session created');

        // ****************** GET ALL Tickets from old Glpi
        for (let i = 0; i < batchSize; i++) {
            const response = await axios.get(`${oldGLPIUrl}?range=${i * batchSize}-${(i + 1) * batchSize - 1}`, {
                headers: { 'Content-Type': 'application/json','App-Token': oldAppToken, 'Session-Token': oldSessionToken }
            });
            const tickets = response.data;
            // console.log('100 new tickets retrieving from Old GLPI');

            for (let ticket of tickets) {

                if ([0,1,2,3,4,5].includes(ticket.status)) { // *********** Filtering tickets
                    const oldUsers_id_recipient = ticket.users_id_recipient;
                    // Control oldUsers_id_recipient
                    if (!oldUsers_id_recipient || oldUsers_id_recipient === 0) {
                        console.warn("   INFO 03 - - - Invalid oldUsers_id_recipient found, skipping: ticket.id: ", ticket.id);
                        continue; // Skip this ticket because of an invalid ID
                    }

                    // Get EMAIL of principal ticket user
                    const userEmailResponse = await axios.get(`${oldBaseUrl}/User/${oldUsers_id_recipient}/UserEmail`, {
                        headers: { 'Content-Type': 'application/json','App-Token': oldAppToken, 'Session-Token': oldSessionToken }
                    });
                    const userEmail = userEmailResponse.data[0]?.email;

                    // Get/Set new  ID of principal ticket user into ticket
                    const newUserId = getUserId(userEmail);
                    ticket._users_id_requester = newUserId;
                    ticket.users_id_recipient = newUserId;

                    // Get New GLPI User ID for lastUpdater by EMAIL  ===> UPDATE ticket lastupdater user
                    const original_lastUpdaterUserId = ticket.users_id_lastupdater;
                    
                    if (!original_lastUpdaterUserId || original_lastUpdaterUserId === 0) {
                        console.warn("    INFO 04 - - - -  Invalid updaterUserId ID found: ticket id:  ", ticket.id);
                        continue; // Skip this ticket for Invalid updaterUserId ID 
                        //TODO Buraya csv
                    }

                    const userLastUpdaterEmailResponse = await axios.get(`${oldBaseUrl}/User/${original_lastUpdaterUserId}/UserEmail`, {
                        headers: { 'Content-Type': 'application/json','App-Token': oldAppToken, 'Session-Token': oldSessionToken }
                    });
                    const userLastUpdaterEmail = userLastUpdaterEmailResponse.data[0]?.email;
                    const newLastUpdaterUserId = getUserId(userLastUpdaterEmail);
                    ticket.users_id_lastupdater = newLastUpdaterUserId;

                    const { ticketUsers, ticketFollowups } = await fetchTicketDetails(ticket.id, oldSessionToken);

                    await addTicketToNewGLPI(ticket, ticketUsers, ticketFollowups, newSessionToken);

                }
            }

            if (tickets.length < batchSize) break; // break loop if all tickets are fetched
        }

        console.log('\x1b[32m', 'Tickets successfully transferred.', '\x1b[0m');
    } catch (error) {
        console.error('transferTickets error occured:', error);
        if (axios.isAxiosError(error)) {
            console.log(error.response.data);
        }
    }
}

transferTickets();
