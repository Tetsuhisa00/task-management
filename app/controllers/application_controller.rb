class ApplicationController < ActionController::Base
    #protect_from_forgery with: :exceptio
    
    include SessionsHelper

    def logged_in_user
        unless logged_in?
          store_location
          flash[:danger] = "Please log in."
          redirect_to login_url
        end
    end

    # 正しいユーザーかどうか確認
    def correct_user
        @user = User.find(params[:id])
        redirect_to(login_url) unless current_user?(@user)
    end

    # 管理者かどうか確認
    def admin_user
        redirect_to(login_url) unless current_user.admin?
    end

end
