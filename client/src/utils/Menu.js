export default function Menu() {
    return render => render`
        <div class="flex items-center space-x-2">
            <a href="/users/search"
               class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150 text-sm font-medium flex items-center">
                <span class="material-icons text-gray-600" style="font-size: 18px; margin-right: 4px;">people</span>
                Users
            </a>
            <a href="/users/edition"
               class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150 text-sm font-medium flex items-center">
                <span class="material-icons text-gray-600" style="font-size: 18px; margin-right: 4px;">person_add</span>
                New User
            </a>
            <a href="/questions/extract"
               class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-150 text-sm font-medium flex items-center">
                <span class="material-icons text-gray-600" style="font-size: 18px; margin-right: 4px;">psychology</span>
                Questions
            </a>
        </div>`;
}
