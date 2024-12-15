class UsersController < ApplicationController
    before_action :logged_in_user, only: [:edit, :update, :destroy, :index, :show]
    before_action :correct_user,   only: [:edit, :update, :show, :destroy, :index]
    before_action :set_user, only: [:show, :edit, :update, :destroy]
    before_action :admin_user, only: :destroy
    # ログインページを表示する前に実行する
    before_action :redirect_if_logged_in, only: [:new, :create]


    def index
    end

    def show
        @user = User.find(params[:id])
    end

    def new
        @user = User.new
    end

    def create
        @user = User.new(user_params)
        if @user.save 
            log_in @user
            session[:user_id] = @user.id
            flash[:success] = "アカウントが作成できました。"
            redirect_to projects_path, notice: 'Signup was Successful!'
        else
            render :new
        end
    end

    def edit 
        @user = User.find(params[:id])
    end

    def update
        @user = User.find(params[:id])
        if @user.update(user_params)
          flash[:success] = "ユーザー情報が更新されました。"
          redirect_to @user, notice: 'User was successfully updated.'
        else
          render :edit
        end
    end

    def redirect_if_logged_in
        redirect_to projects_path if logged_in?
    end

    def destroy
        User.find(params[:id]).destroy
        flash[:success] = "User deleted"
        redirect_to users_url
    end

    private

    def set_user
        @user = User.find(params[:id])
      end
    
    def user_params
        params.require(:user).permit(:user_name, :email, :password, :password_confirmation)
    end

    # ログイン済みユーザーかどうか確認
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
        redirect_to(projects_path) unless current_user?(@user)
    end

    # 管理者かどうか確認
    def admin_user
        redirect_to(projects_path) unless current_user?(@user)
    end
end
