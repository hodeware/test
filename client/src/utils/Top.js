export default function Top() {
    return render => render`
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <span class="material-icons" style="font-size: 32px;">group</span>
                        <h1 class="text-2xl font-bold">User Management</h1>
                    </div>
                    <nav>
                        <Menu />
                    </nav>
                </div>
            </div>
        </div>`;
}
