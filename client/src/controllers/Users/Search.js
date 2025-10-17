import jSuites from "jsuites";

export default function Search() {
    const self = this;

    self.onload = function() {
        jSuites.ajax({
            url: '/api/users',
            method: 'GET',
            success: function(result) {
                if (result.success) {
                    self.data = result.data;
                }
            },
            error: function(error) {
                console.error('Failed to load users:', error);
            }
        })
    }

    self.data = []

    self.columns = [
        { name: 'id', title: 'ID', width: '80px', align: 'center' },
        { name: 'name', title: 'Name', width: '200px', align: 'left' },
        { name: 'email', title: 'Email', width: '250px', align: 'left' },
    ]

    self.onRowClick = function(instance, row, rowNumber, columnNumber) {
        const userId = self.data[rowNumber].id;
        window.location.href = `/users/edition?id=${userId}`;
    }

    return `<div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">Users List</h2>
                <p class="text-gray-600 mt-1">Manage and view all users in the system</p>
            </div>
            <a href="/users/edition"
               class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200 flex items-center space-x-2">
                <span class="material-icons" style="font-size: 20px;">person_add</span>
                <span>Add New User</span>
            </a>
        </div>
        <div class="overflow-x-auto">
            <Datagrid
                data="{{self.data}}"
                columns="{{self.columns}}"
                onclick="self.onRowClick"
                onupdate="console.log('Data grid was updated')"
                onchangepage="console.log('Data grid page changed')"
                :pagination="10"
                :ref="self.ref" />
        </div>
    </div>`
}
