Rails.application.routes.draw do
  # Defines the root path route ("/")
  root "home#index"

  # Projects routes with nested WBS routes
  resources :projects do
    get 'wbs', to: 'wbs#index'
    post 'wbs', to: 'wbs#post'
  end

  # User sign-up routes
  get '/users/signup', to: 'users#new', as: 'signup'
  post '/users/signup', to: 'users#create'

  # Session routes for login and logout
  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  delete 'logout', to: 'sessions#destroy'

  # User routes
  resources :users, only: [:new, :create, :edit, :update, :show]
end
