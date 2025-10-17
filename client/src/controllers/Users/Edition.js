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

    return `<div class="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">User Information</h2>
            <p class="text-gray-600 mt-1">Fill in the details below to create or update a user</p>
        </div>

        <form class="space-y-6">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Name <span class="text-red-500">*</span>
                </label>
                <input type="text"
                       name="name"
                       placeholder="Enter full name"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                       required>
            </div>

            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span class="text-red-500">*</span>
                </label>
                <input type="email"
                       name="email"
                       placeholder="user@example.com"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                       required>
            </div>

            <div class="flex items-center space-x-4 pt-4">
                <button type="button"
                        onclick="self.save()"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span class="material-icons" style="font-size: 20px;">check</span>
                    <span>Save User</span>
                </button>
                <button type="button"
                        onclick="self.cancel()"
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center space-x-2">
                    <span class="material-icons" style="font-size: 20px;">close</span>
                    <span>Cancel</span>
                </button>
            </div>
        </form>
    </div>`;
}
