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
        window.location.href = `/clients/edition?id=${userId}`;
    }

    return `<div class="p20">
        <div class="row" style="margin-bottom: 20px;">
            <div class="column">
                <h2>Users</h2>
                <a href="/clients/edition" class="jbutton dark">Add New User</a>
            </div>
        </div>
        <Datagrid
            data="{{self.data}}"
            columns="{{self.columns}}"
            onclick="self.onRowClick"
            onupdate="console.log('Data grid was updated')"
            onchangepage="console.log('Data grid page changed')"
            :pagination="10"
            :ref="self.ref" />
    </div>`
}
