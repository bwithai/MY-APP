var ApiClient = {
    baseUrl: 'http://localhost:8001/api/v1/',
    token: null,

    login: function(username, password) {
        var formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return fetch(this.baseUrl + 'login/access-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: formData.toString()
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getMe: function() {
        return fetch(this.baseUrl + 'users/me', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            return response.json();
        });
    },

    // Add other API methods from sdk.gen.ts here
    createIBAN: function(iban) {
        return fetch(this.baseUrl + 'iban', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ iban: iban })
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to create IBAN');
            }
            return response.json();
        });
    },

    getDashboardData: function() {
        return fetch(this.baseUrl + 'dashboard', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            return response.json();
        });
    },

    getInflows: function({ skip, limit, search, userId }) {
        var url = new URL(this.baseUrl + 'inflows/');  // Note the trailing slash
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        if (search) url.searchParams.append('search', search);
        if (userId) url.searchParams.append('user_id', userId);

        console.log('Calling Inflow API:', url.toString());

        return fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    handleResponse: function(response) {
        if (!response.ok) {
            if (response.status === 422) {
                return response.json().then(function(data) {
                    throw new Error(data.detail || 'Validation error');
                });
            }
            throw new Error('HTTP error ' + response.status);
        }
        return response.json();
    },

    handleError: function(error) {
        console.error('API Error:', error);
        throw error;
    }
};

window.ApiClient = ApiClient; // Make it globally available 