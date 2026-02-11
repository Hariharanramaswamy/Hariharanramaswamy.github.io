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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function handleFileSelect(input, nameId, buttonId, msgId) {
    const nameEl = document.getElementById(nameId);
    const btnEl = document.getElementById(buttonId);
    const msgEl = document.getElementById(msgId);

    msgEl.style.display = 'none';
    msgEl.className = 'message-box';
    msgEl.innerText = '';

    if (!input.files || !input.files.length) {
        nameEl.innerText = 'No file selected';
        btnEl.disabled = true;
        return;
    }

    const file = input.files[0];

    if (file.type !== 'application/pdf') {
        nameEl.innerText = 'No file selected';
        btnEl.disabled = true;
        input.value = '';
        msgEl.innerText = 'Only PDF files are allowed.';
        msgEl.className = 'message-box error';
        msgEl.style.display = 'block';
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        nameEl.innerText = 'No file selected';
        btnEl.disabled = true;
        input.value = '';
        msgEl.innerText = 'File size must be under 5 MB.';
        msgEl.className = 'message-box error';
        msgEl.style.display = 'block';
        return;
    }

    nameEl.innerText = file.name;
    btnEl.disabled = false;
}

async function uploadDocument(type) {
    const inputId = type === 'abstract' ? 'abstractFile' : 'prototypeFile';
    const btnId = type === 'abstract' ? 'btnAbstract' : 'btnPrototype';
    const msgId = type === 'abstract' ? 'msgAbstract' : 'msgPrototype';
    const nameId = type === 'abstract' ? 'abstractName' : 'prototypeName';

    const input = document.getElementById(inputId);
    const btnEl = document.getElementById(btnId);
    const msgEl = document.getElementById(msgId);
    const nameEl = document.getElementById(nameId);

    if (!input.files || !input.files.length) {
        return;
    }

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    btnEl.disabled = true;
    btnEl.innerText = 'UPLOADING…';
    msgEl.style.display = 'none';

    try {
    const res = await fetch(`${window.API_BASE}/profile/upload/${type}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${Auth.getToken()}`
        },
        body: formData
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Upload failed');
    }

    msgEl.innerText =
        `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully.`;
    msgEl.className = 'message-box success';
    msgEl.style.display = 'block';

    input.value = '';
    nameEl.innerText = 'No file selected';

} catch (err) {
    msgEl.innerText = err.message || 'Upload failed. Please try again.';
    msgEl.className = 'message-box error';
    msgEl.style.display = 'block';
}
 finally {
        btnEl.disabled = true;
        btnEl.innerText = type === 'abstract' ? 'UPLOAD ABSTRACT' : 'UPLOAD PROTOTYPE';
    }
}
