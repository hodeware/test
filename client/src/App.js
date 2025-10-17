import { UsersEdition, UsersSearch } from './controllers/Users';

export default function App() {
    this.beforeChange = (route, config) => {
    }

    return render => (render)`<>
        <Header />
        <div class="row" style="justify-content: left;">
            <Menu />
            <Router @ref="self.router">
                <Route path="/users/(.*)" controller="${UsersEdition}" />
                <Route path="/users/search" controller="${UsersSearch}" />
            </Router>
        </div>
    </>`;
}
