/**
 * admin.js
 * Logic for Admin Dashboard
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth & Role Guard
    const authState = await Auth.verifyAuth();
    const userRole = localStorage.getItem('role');

    if (!authState.authenticated || (userRole !== 'ADMIN' && userRole !== 'ROLE_ADMIN')) {
        window.location.href = 'index.html';
        return;
    }

    // Show Dashboard
    document.getElementById('authGuard').style.display = 'block';
    document.body.classList.remove('loading');

    // Restore Reviewer Selection
    const savedReviewer = localStorage.getItem('adminReviewer');
    if (savedReviewer) {
        document.getElementById('reviewerName').value = savedReviewer;
    }

    // Load Teams
    fetchTeams();
});

function updateReviewer(name) {
    localStorage.setItem('adminReviewer', name);
}

/* ============================= */
/* FETCH TEAMS */
/* ============================= */

async function fetchTeams() {
    const token = Auth.getToken();

    if (!token) {
        console.error("Token missing");
        return;
    }

    try {
        const res = await fetch(`${window.API_BASE}/admin/teams`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch teams');

        const teams = await res.json();
        renderTeams(teams);

    } catch (err) {
        console.error(err);
        showToast('Failed to load teams', 'error');
        document.getElementById('teamGrid').innerHTML =
            '<div style="grid-column: 1/-1; text-align: center; color: var(--error);">Failed to load data.</div>';
    }
}

/* ============================= */
/* RENDER TEAMS */
/* ============================= */

function renderTeams(teams) {
    const grid = document.getElementById('teamGrid');
    grid.innerHTML = '';

    if (!teams || teams.length === 0) {
        grid.innerHTML =
            '<div style="grid-column: 1/-1; text-align: center; color: #64748b;">No teams found.</div>';
        return;
    }

    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = `team-card status-${team.status}`;

        const membersHtml = team.members.map(name =>
            `<div class="member-item">${name}</div>`
        ).join('');

        const isPending = team.status === 'PENDING';

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="team-name">${team.teamName}</div>
                    <div class="college-name">${team.collegeName}</div>
                </div>
                <span class="status-badge status-${team.status}">${team.status}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Leader:</span>
                <span class="info-value">${team.leaderName}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Count:</span>
                <span class="info-value">${team.memberCount}</span>
            </div>

            <div class="members-list">
                <div class="members-title">Team Members</div>
                ${membersHtml}
            </div>

            <div class="action-container">
                <div class="view-btn-group">
                    <button class="btn btn-outline" onclick="viewDocument(${team.id}, 'abstract')">
                        <i class="fas fa-file-pdf"></i> Abstract
                    </button>
                    <button class="btn btn-outline" onclick="viewDocument(${team.id}, 'prototype')">
                        <i class="fas fa-cube"></i> Prototype
                    </button>
                </div>

                <div class="decision-group">
                    <button class="btn btn-select"
                        onclick="handleDecision(${team.id}, 'SELECTED')"
                        ${!isPending ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> SELECT
                    </button>

                    <button class="btn btn-reject"
                        onclick="handleDecision(${team.id}, 'REJECTED')"
                        ${!isPending ? 'disabled' : ''}>
                        <i class="fas fa-times"></i> REJECT
                    </button>
                </div>

                ${team.reviewedBy ? `<div class="reviewed-by">Reviewed by ${team.reviewedBy}</div>` : ''}
            </div>
        `;

        grid.appendChild(card);
    });
}

/* ============================= */
/* VIEW DOCUMENT */
/* ============================= */

function viewDocument(teamId, type) {
    const token = Auth.getToken();
    if (!token) return;

    fetch(`${window.API_BASE}/admin/teams/${teamId}/${type}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) throw new Error('Document not found');
            return res.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        })
        .catch(() => {
            showToast('Document unavailable', 'error');
        });
}

/* ============================= */
/* HANDLE DECISION */
/* ============================= */

async function handleDecision(teamId, status) {
    const reviewer = document.getElementById('reviewerName').value;
    if (!reviewer) {
        showToast('Please select a Reviewer first!', 'error');
        document.getElementById('reviewerName').focus();
        return;
    }

    if (!confirm(`Are you sure you want to mark this team as ${status}?`)) return;

    const token = Auth.getToken();
    if (!token) return;

    try {
        const res = await fetch(`${window.API_BASE}/admin/teams/${teamId}/decision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: status,
                reviewedBy: reviewer
            })
        });

        if (res.status === 409) {
            showToast('This team has already been reviewed by another admin.', 'error');
            fetchTeams();
            return;
        }

        if (!res.ok) throw new Error('Update failed');

        showToast(`Team ${status} successfully!`);
        fetchTeams();

    } catch (err) {
        console.error(err);
        showToast('Failed to update status', 'error');
    }
}

/* ============================= */
/* TOAST */
/* ============================= */

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
