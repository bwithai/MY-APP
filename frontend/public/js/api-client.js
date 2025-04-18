var ApiClient = {
    baseUrl: (window.ENV && window.ENV.API_URL) + "/api/v1/",
    token: null,

    /*----------------------------------------------------------------------------------------------------
        [ All the Users API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
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

    readUsers: function({ skip, limit, search }) {
        var url = new URL(this.baseUrl + 'users/');
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        if (search) url.searchParams.append('search', search);

        return fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
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

    /*----------------------------------------------------------------------------------------------------
        [ All the Dashboard API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
    readFinanceOverview: function(user_id) {
        return fetch(this.baseUrl + 'dashboard/over-view/' + user_id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    readCurrentMonthFinanceOverview: function(data) {
        return fetch(this.baseUrl + 'dashboard/' + data.year + '/' + data.month + '/' + data.userId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    readRangeFinanceOverview: function(data) {
        return fetch(this.baseUrl + 'dashboard/range/' + data.start_date + '/' + data.end_date + '/' + data.userId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    readYearlyData: function(data) {
        return fetch(this.baseUrl + 'dashboard/' + data.year + '/' + data.userId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Accept': 'application/json'
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    /*----------------------------------------------------------------------------------------------------
        [ All the Inflows API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
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

    createInflow: function(data) {
        console.log('Creating Inflow:', JSON.stringify(data));
        return fetch(this.baseUrl + 'inflows/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getInflow: function(id) {
        console.log('Getting Inflow:', id);
        return fetch(this.baseUrl + 'inflows/' + id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    updateInflow: function(id, data) {
        return fetch(this.baseUrl + 'inflows/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    deleteInflow: function(id) {
        return fetch(this.baseUrl + 'inflows/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    /*----------------------------------------------------------------------------------------------------
        [ All the Outflows API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
    getOutflows: function({ skip, limit, search, userId }) {
        var url = new URL(this.baseUrl + 'outflows/');  // Note the trailing slash
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

    createOutflow: function(data) {
        console.log('Creating Outflow:', JSON.stringify(data));
        return fetch(this.baseUrl + 'outflows/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    getOutflow: function(id) {
        console.log('Getting Outflow:', id);
        return fetch(this.baseUrl + 'outflows/' + id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    updateOutflow: function(id, data) {
        return fetch(this.baseUrl + 'outflows/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    deleteOutflow: function(id) {
        return fetch(this.baseUrl + 'outflows/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    /*----------------------------------------------------------------------------------------------------
        [ All the Investments API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
    getInvestments: function({ skip, limit, search, userId }) {
        var url = new URL(this.baseUrl + 'investment/');
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        if (search) url.searchParams.append('search', search);
        if (userId) url.searchParams.append('user_id', userId);

        console.log('Calling Investments API:', url.toString());

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

    createInvestment: function(data) {
        console.log('Creating Investment:', JSON.stringify(data));
        return fetch(this.baseUrl + 'investment/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getInvestment: function(id) {
        console.log('Getting Investment:', id);
        return fetch(this.baseUrl + 'investment/' + id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    updateInvestment: function(id, data) {
        console.log('Updating Investment:', id, JSON.stringify(data));
        return fetch(this.baseUrl + 'investment/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getInvestmentHistory: function(id) {
        return fetch(this.baseUrl + 'investment/history/' + id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    deleteInvestment: function(id) {
        console.log('Deleting Investment:', id);
        return fetch(this.baseUrl + 'investment/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    /*----------------------------------------------------------------------------------------------------  
        [ All the Liabilities API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
    getLiabilities: function({ skip, limit, search, userId }) {
        var url = new URL(this.baseUrl + 'liability/');
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        if (search) url.searchParams.append('search', search);
        if (userId) url.searchParams.append('user_id', userId);

        console.log('Calling Investments API:', url.toString());

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

    createLiability: function(data) {
        console.log('Creating Liability:', JSON.stringify(data));
        return fetch(this.baseUrl + 'liability/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getLiability: function(id) {
        console.log('Getting Liability:', id);
        return fetch(this.baseUrl + 'liability/' + id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    updateLiability: function(id, data) {
        return fetch(this.baseUrl + 'liability/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    payLiability: function(id, data) {
        return fetch(this.baseUrl + 'liability/pay/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getLiabilityHistory: function(id) {
        return fetch(this.baseUrl + 'liability/history/' + id, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    deleteLiability: function(id) {
        return fetch(this.baseUrl + 'liability/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    /*----------------------------------------------------------------------------------------------------
        [ All the Assets API calls will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
    getAssets: function({ skip, limit, search, userId }) {
        var url = new URL(this.baseUrl + 'assets/');
        url.searchParams.append('skip', skip);
        url.searchParams.append('limit', limit);
        if (search) url.searchParams.append('search', search);
        if (userId) url.searchParams.append('user_id', userId);

        console.log('Calling Assets API:', url.toString());

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

    updateAsset: function(id, data) {
        console.log('Updating Asset:', id, JSON.stringify(data));
        return fetch(this.baseUrl + 'assets/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    disposeAsset: function(id, data) {
        console.log('Disposing Asset:', id, JSON.stringify(data));
        return fetch(this.baseUrl + 'assets/dispose/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    /*----------------------------------------------------------------------------------------------------
        [ All the Common API calls which will be used in multiple pages will be handled bellow this line ]
    ----------------------------------------------------------------------------------------------------*/
    getHeads: function(type) {
        return fetch(this.baseUrl + 'common/heads?type=' + type, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    getAllHeads: function() {
        return fetch(this.baseUrl + 'common/all-heads', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    createHead: function(data) {
        return fetch(this.baseUrl + 'common/heads', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    createSubHead: function(data) {
        return fetch(this.baseUrl + 'common/sub-heads', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'  
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    deleteSubHead: function(id) {
        return fetch(this.baseUrl + 'common/sub-heads/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },  

    updateHead: function(id, data) {
        return fetch(this.baseUrl + 'common/heads/' + id, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    deleteHead: function(id) {
        return fetch(this.baseUrl + 'common/heads/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    // ---------------------------->>>  IVY Read <<<----------------------------
    readIvy: function() {
        return fetch(this.baseUrl + 'common/ivy', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    // ---------------------------->>>  IVY Update <<<----------------------------    
    updateDive: function(data) {
        return fetch(this.baseUrl + 'common/ivy/div', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },  
    updateBrigade: function(data) {
        return fetch(this.baseUrl + 'common/ivy/brigade', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'  
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    updateUnit: function(data) {
        return fetch(this.baseUrl + 'common/ivy/unit', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    // ---------------------------->>>  IVY Create <<<----------------------------
    createCorp: function(data) {
        return fetch(this.baseUrl + 'common/ivy/corp', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    createDiv: function(data) {
        return fetch(this.baseUrl + 'common/ivy/div', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    createBrig: function(data) {
        return fetch(this.baseUrl + 'common/ivy/brigade', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    createUnit: function(data) {
        return fetch(this.baseUrl + 'common/ivy/unit', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    // ---------------------------->>>  IVY Delete <<<----------------------------
    deleteIVY: function(data) {
        return fetch(this.baseUrl + 'common/ivy-deletion/' + data.flag + '/' + data.id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },
    /*------------------------------------ End of Heads API calls -------------------------------------*/

    getIBANs: function(userId) {
        return fetch(this.baseUrl + 'users/iban/' + userId, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(this.handleResponse)
        .catch(this.handleError);
    },

    handleResponse: function(response) {
        if (!response.ok) {
            return response.json().then(function(data) {
                if (response.status === 422) {
                    // Handle validation errors
                    var message = data.detail;
                    if (Array.isArray(data.detail)) {
                        message = data.detail.map(err => err.msg).join(', ');
                    }
                    throw new Error(message);
                }
                throw new Error(data.detail || 'HTTP error ' + response.status);
            });
        }
        return response.json();
    },

    handleError: function(error) {
        console.error('API Error:', error);
        throw error;
    }
};

window.ApiClient = ApiClient; // Make it globally available 