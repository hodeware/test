export default function Top() {
    return render => render`
        <header class="bg-white border-b border-gray-200">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="material-icons text-gray-800" style="font-size: 28px;">apps</span>
                        <h1 class="text-xl font-semibold text-gray-900">Management</h1>
                    </div>
                    <nav>
                        <Menu />
                    </nav>
                </div>
            </div>
        </header>`;
}
