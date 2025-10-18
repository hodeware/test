import { QuestionsExtract, QuestionsRender } from './controllers/Questions';
import error from './utils/error.js'

export default function App() {
    this.beforeChange = (route, config) => {
    }

    return render => (render)`<>
        <div class="min-h-screen bg-gray-50">
            <Top/>
            <main class="container mx-auto px-6 py-8">
                <Router @ref="self.router">
                    <Route path="/questions/extract" controller="${QuestionsExtract}" />
                    <Route path="/questions/render/(.*)" controller="${QuestionsRender}" />
                    <Route path="(.*)" controller="${error}" />
                </Router>
            </main>
        </div>
    </>`;
}
