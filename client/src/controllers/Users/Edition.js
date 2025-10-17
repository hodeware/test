import jSuites from "jsuites";

export default function Edition() {
    let self = this;
    let form = null;

    self.onload = function() {
        // Get user ID from URL if editing existing user
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        if (userId) {
            // Load existing user data
            jSuites.ajax({
                url: `/api/users/${userId}`,
                method: 'GET',
                success: function(result) {
                    if (result.success) {
                        const user = result.data;
                        self.el.querySelector('[name="name"]').value = user.name || '';
                        self.el.querySelector('[name="email"]').value = user.email || '';
                    }
                }
            });
        }
    }

    self.save = function() {
        const formData = {
            name: self.el.querySelector('[name="name"]').value,
            email: self.el.querySelector('[name="email"]').value
        };

        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        const config = {
            url: userId ? `/api/users/${userId}` : '/api/users',
            method: userId ? 'PUT' : 'POST',
            dataType: 'json',
            data: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            },
            success: function(result) {
                if (result.success) {
                    alert('User saved successfully!');
                    window.location.href = '/clients/search';
                } else {
                    alert('Error: ' + result.message);
                }
            },
            error: function(error) {
                alert('Failed to save user');
                console.error(error);
            }
        };

        jSuites.ajax(config);
    }

    return `<form class="p20">
        <div class='row'>
            <div class='column'>
                <div class='form-group'>
                    <label>Name</label>
                    <input type='text' name='name'>
                </div>
            </div>
        </div>
        <div class='row'>
            <div class='column'>
                <div class='form-group'>
                    <label>Email</label>
                    <input type='email' name='email'>
                </div>
            </div>
        </div>

        <br>

        <div class='row'>
            <div class='column'>
                <div class='form-group'>
                    <input type='button' value='Save' onclick="self.save()" class="jbutton dark">
                </div>
            </div>
        </div>
    </form>`;
}
