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

    return `<div class="bg-white rounded-xl border border-gray-200 p-8">
        <div class="flex items-center justify-between mb-8">
            <div>
                <h2 class="text-2xl font-semibold text-gray-900">Users</h2>
                <p class="text-gray-500 text-sm mt-1">Manage your team members and their account permissions</p>
            </div>
            <a href="/users/edition"
               class="bg-black hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-lg transition-colors duration-150 flex items-center space-x-2">
                <span class="material-icons" style="font-size: 18px;">add</span>
                <span>Add user</span>
            </a>
        </div>
        <div class="overflow-x-auto -mx-8 px-8">
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
