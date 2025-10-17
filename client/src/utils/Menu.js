export default function Menu() {
    return render => render`
        <div class="flex space-x-1">
            <a href="/users/search"
               class="px-4 py-2 rounded-md text-white hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center">
                <span class="material-icons" style="font-size: 20px; margin-right: 6px;">people</span>
                Users
            </a>
            <a href="/users/edition"
               class="px-4 py-2 rounded-md text-white hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center">
                <span class="material-icons" style="font-size: 20px; margin-right: 6px;">person_add</span>
                New User
            </a>
            <a href="/questions/extract"
               class="px-4 py-2 rounded-md text-white hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center">
                <span class="material-icons" style="font-size: 20px; margin-right: 6px;">psychology</span>
                Question Extractor
            </a>
        </div>`;
}
