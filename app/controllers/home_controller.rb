class HomeController < ApplicationController

  #before_action :logged_in_user
  
  def index
    if session[:user_id]
	    # findの場合はユーザを存在しないとエラーを返すのでfind_byを使う
      @user = User.find_by(id: session[:user_id])
    end
  end
end
