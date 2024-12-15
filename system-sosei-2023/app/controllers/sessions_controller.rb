class SessionsController < ApplicationController
include SessionsHelper
    # ログインページを表示する前に実行する
    before_action :redirect_if_logged_in, only: [:new, :create]
    def new
    end
  
    def create
      user = User.find_by(email: params[:session][:email].downcase)
      if user && user&.authenticate(params[:session][:password])
        log_in user
        redirect_to projects_path, notice: 'Logged in!'
      else
        flash.now[:danger] = 'Invalid email/password combination'
        render 'new'

      end
    end

    def redirect_if_logged_in
      redirect_to projects_path if logged_in?
    end
  
    def destroy
      log_out if logged_in?
      redirect_to login_url, notice: 'Logged out!'
    end
    
end
