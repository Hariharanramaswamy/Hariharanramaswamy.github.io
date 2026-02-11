const Auth = {
    KEYS: {
        TOKEN: 'token',
        USERNAME: 'username',
        ROLE: 'role'
    },

    // --------------------
    // SIGNUP
    // --------------------
    async signup(username, password) {
        try {
            const res = await fetch(`${window.API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                return {
                    success: false,
                    message: data.message || 'Signup failed'
                };
            }

            return {
                success: true,
                message: 'Signup successful'
            };

        } catch (e) {
            console.error(e);
            return {
                success: false,
                message: 'Network error'
            };
        }
    },

    // --------------------
    // LOGIN
    // --------------------
    async login(username, password) {
        try {
            const res = await fetch(`${window.API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok || !data.token) {
                return {
                    success: false,
                    message: data.message || 'Login failed'
                };
            }

            localStorage.setItem(this.KEYS.TOKEN, data.token);
            localStorage.setItem(this.KEYS.USERNAME, data.username);

            const role = data.role || 'USER';
            localStorage.setItem(this.KEYS.ROLE, role);

            if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
                window.location.assign('admin-dashboard.html');
            } else {
                window.location.assign('index.html');
            }

            return { success: true };

        } catch (e) {
            console.error(e);
            return {
                success: false,
                message: 'Network error'
            };
        }
    },

    // --------------------
    // TOKEN
    // --------------------
    getToken() {
        return localStorage.getItem(this.KEYS.TOKEN);
    },

    // --------------------
    // BACKEND VERIFICATION
    // --------------------
    async verifyAuth() {
        const token = localStorage.getItem(this.KEYS.TOKEN);

        if (!token) {
            return { authenticated: false };
        }

        try {
            const res = await fetch(`${window.API_BASE}/auth/me`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                return { authenticated: false };
            }

            const user = await res.json();

            if (user.username) {
                localStorage.setItem(this.KEYS.USERNAME, user.username);
            }
            if (user.role) {
                localStorage.setItem(this.KEYS.ROLE, user.role);
            }

            return {
                authenticated: true,
                user
            };

        } catch (e) {
            console.error('verifyAuth error:', e);
            return { authenticated: false };
        }
    },

    // --------------------
    // LOGOUT
    // --------------------
    logout() {
        localStorage.removeItem(this.KEYS.TOKEN);
        localStorage.removeItem(this.KEYS.USERNAME);
        localStorage.removeItem(this.KEYS.ROLE);
        window.location.assign('index.html');
    },

    // --------------------
    // CURRENT USER
    // --------------------
    getUser() {
        const username = localStorage.getItem(this.KEYS.USERNAME);
        const role = localStorage.getItem(this.KEYS.ROLE);

        if (!username) return null;
        return { username, role };
    }
};

window.Auth = Auth;
