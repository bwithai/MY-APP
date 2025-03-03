var InflowUtils = {
    cleanup: function (modalId) {
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }
        window.onclick = null;
    },

    loadHeadsData: function (headSelectId, callback) {
        ApiClient.getHeads()
            .then(function (response) {
                var headSelect = document.getElementById(headSelectId);
                headSelect.innerHTML = '<option value="">Select a head</option>';
                response.data.forEach(function (head) {
                    var option = document.createElement('option');
                    option.value = head.id;
                    option.textContent = head.heads;
                    if (head.sub_heads && head.sub_heads.length > 0) {
                        option.dataset.subheads = JSON.stringify(head.sub_heads);
                    }
                    headSelect.appendChild(option);
                });
                if (callback) callback();
            })
            .catch(function (error) {
                console.error('Failed to load heads:', error);
            });
    },

    loadSubHeads: function (headSelectId, subHeadSelectId, subHeadContainerId) {
        var headSelect = document.getElementById(headSelectId);
        var subHeadSelect = document.getElementById(subHeadSelectId);
        var subHeadContainer = document.getElementById(subHeadContainerId);

        var selectedHead = headSelect.options[headSelect.selectedIndex];

        if (selectedHead && selectedHead.dataset.subheads) {
            var subHeads = JSON.parse(selectedHead.dataset.subheads);
            subHeadSelect.innerHTML = '<option value="">Select a sub-head</option>';
            subHeads.forEach(function (subHead) {
                var option = document.createElement('option');
                option.value = subHead.id;
                option.textContent = subHead.subheads;
                subHeadSelect.appendChild(option);
            });
            subHeadContainer.style.display = 'block';
        } else {
            subHeadContainer.style.display = 'none';
        }
    },

    loadIBANs: function (ibanSelectId) {
        var userId = sessionStorage.getItem('selectedUserId');
        if (!userId) return;

        ApiClient.getIBANs(userId)
            .then(function (response) {
                var ibanSelect = document.getElementById(ibanSelectId);
                ibanSelect.innerHTML = '<option value="">Select IBAN</option>';
                response.forEach(function (iban) {
                    var option = document.createElement('option');
                    option.value = iban.id;
                    option.textContent = iban.iban;
                    ibanSelect.appendChild(option);
                });
            })
            .catch(function (error) {
                console.error('Failed to load IBANs:', error);
            });
    }
};

window.InflowUtils = InflowUtils;
