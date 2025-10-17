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
                    window.location.href = '/users/search';
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

    self.cancel = function() {
        window.location.href = '/users/search';
    }

    return `<div class="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl mx-auto">
        <div class="mb-8">
            <h2 class="text-2xl font-semibold text-gray-900">User details</h2>
            <p class="text-gray-500 text-sm mt-1">Add or update user information</p>
        </div>

        <form class="space-y-5">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Full name
                </label>
                <input type="text"
                       name="name"
                       placeholder="Enter name"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-150 outline-none text-sm"
                       required>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                </label>
                <input type="email"
                       name="email"
                       placeholder="user@example.com"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-150 outline-none text-sm"
                       required>
            </div>

            <div class="flex items-center space-x-3 pt-6">
                <button type="button"
                        onclick="self.cancel()"
                        class="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg border border-gray-300 transition-colors duration-150">
                    Cancel
                </button>
                <button type="button"
                        onclick="self.save()"
                        class="flex-1 bg-black hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors duration-150">
                    Save
                </button>
            </div>
        </form>
    </div>`;
}
