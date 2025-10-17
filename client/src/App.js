import { UsersEdition, UsersSearch } from './controllers/Users';
import { QuestionsExtract } from './controllers/Questions';
import error from './utils/error.js'

export default function App() {
    this.beforeChange = (route, config) => {
    }

    return render => (render)`<>
        <div class="min-h-screen bg-gray-100">
            <Top/>
            <div class="container mx-auto px-6 py-8">
                <Router @ref="self.router">
                    <Route path="/users/search" controller="${UsersSearch}" />
                    <Route path="/users/(.*)" controller="${UsersEdition}" />
                    <Route path="/questions/extract" controller="${QuestionsExtract}" />
                    <Route path="(.*)" controller="${error}" />
                </Router>
            </div>
        </div>
    </>`;
}
