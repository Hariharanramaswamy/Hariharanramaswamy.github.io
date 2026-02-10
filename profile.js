document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth guard (BACKEND decides)
    const authState = await Auth.verifyAuth();

    if (!authState.authenticated) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${window.API_BASE}/profile`, {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`
            }
        });

        // 2. Logged in but NOT registered
        if (res.status === 404) {
            document.body.classList.remove('loading');
            document.getElementById('unregisteredContainer').style.display = 'block';
            return;
        }

        // 3. Any other failure
        if (!res.ok) {
            throw new Error('Failed to load profile');
        }

        // 4. Registered user
        const data = await res.json();

        renderProfile(data);

        document.getElementById('loadingProfile').style.display = 'none';
        document.getElementById('profileDetails').style.display = 'block';
        document.getElementById('profileContainer').style.display = 'block';
        document.body.classList.remove('loading');

    } catch (err) {
        console.error(err);
        document.body.classList.remove('loading');
        const errorBox = document.getElementById('profileError');
        errorBox.innerText = 'Unable to load profile. Please refresh.';
        errorBox.style.display = 'block';
    }
});

function renderProfile(data) {
    document.getElementById('leaderName').innerText =
        data.leaderName || '-';

    document.getElementById('collegeName').innerText =
        data.collegeName || '-';

    document.getElementById('teamName').innerText =
        data.teamName || '-';
}
