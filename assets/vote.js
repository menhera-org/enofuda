
const assembly = JSON.parse(document.querySelector('meta[name="enofuda:assembly"]').content);
const ticket = JSON.parse(document.querySelector('meta[name="enofuda:ticket"]').content);

const voteButton = document.getElementById('vote-button');

function vote() {
    const proposalVotes = document.querySelectorAll('select.proposal-vote');
    const proposals = {};
    for (const proposalVote of proposalVotes) {
        proposalVote.disabled = true;
        const proposalId = proposalVote.dataset.proposalId;
        if (!proposalId || !proposalVote.value) {
            continue;
        }
        proposals[proposalId] = proposalVote.value;
    }
    const vote = {
        assembly_uuid: assembly.uuid,
        ticket_uuid: ticket.uuid,
        token: ticket.token,
        proposals: proposals,
    };
    const url = '/vote';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(vote),
    }).then(response => {
        if (response.ok) {
            document.body.classList.add('voted');
            const voted = document.getElementById('voted');
            voted.hidden = false;
        } else {
            response.json().then(json => {
                error(json.error);
            });
        }
    });
}

function error(message) {
    document.body.classList.add('error');
    document.getElementById('error-message').textContent = message;
}

voteButton.addEventListener('click', vote);
