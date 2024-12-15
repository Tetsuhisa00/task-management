class User < ApplicationRecord
    has_secure_password

    validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :user_name, presence: true, length: { minimum: 3 }

    has_many :tasks
    has_many :projects_users
    has_many :projects, through: :projects_users
end
